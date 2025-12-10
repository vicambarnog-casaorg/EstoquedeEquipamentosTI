// app.js
// Lógica principal: autenticação, CRUD produtos, UI, integrações com camera/storage/manutencao
(function(){
  // ----- DOM refs -----
  const btnOpenLogin = document.getElementById('btnOpenLogin');
  const btnLogout = document.getElementById('btnLogout');
  const sidebarUser = document.getElementById('sidebarUser');
  const statUser = document.getElementById('statUser');
  const statProducts = document.getElementById('statProducts');
  const statPhotos = document.getElementById('statPhotos');
  const productTable = document.getElementById('productTable');
  const productCount = document.getElementById('productCount');

  // form/modal refs
  const productFormModal = document.getElementById('productFormModal');
  const openCameraBtn = document.getElementById('openCameraBtn');
  const closeProductForm = document.getElementById('closeProductForm');
  const saveProductBtn = document.getElementById('saveProductBtn');
  const selectFilesBtn = document.getElementById('selectFilesBtn');
  const fileInput = document.getElementById('fileInput');
  const stagedPreview = document.getElementById('stagedPreview');
  const btnNewProduct = document.getElementById('btnNewProduct');

  const productDetailCard = document.getElementById('productDetailCard');
  const detailName = document.getElementById('detailName');
  const detailSubtitle = document.getElementById('detailSubtitle');
  const detailPhotos = document.getElementById('detailPhotos');
  const maintList = document.getElementById('maintList');

  // camera modal & maint modal refs
  const cameraModal = document.getElementById('cameraModal');
  const maintModal = document.getElementById('maintModal');
  const btnOpenMaintModal = document.getElementById('btnOpenMaintModal');
  const closeMaintBtn = document.getElementById('closeMaintBtn');
  const saveMaintBtn = document.getElementById('saveMaintBtn');
  const maintDate = document.getElementById('maintDate');
  const maintDesc = document.getElementById('maintDesc');
  const btnAddPhotoToProduct = document.getElementById('btnAddPhotoToProduct');

  // form fields
  const numeroInput = document.getElementById('numeroInput');
  const equipamentoInput = document.getElementById('equipamentoInput');
  const setorInput = document.getElementById('setorInput');
  const configInput = document.getElementById('configInput');

  // state
  let currentUser = null;
  let productsUnsub = null;
  let stagedFiles = []; // files waiting to upload in new-product flow
  let currentProductId = null;

  // helper: show/hide modals
  function showModal(el) { el.classList.add('show'); }
  function hideModal(el) { el.classList.remove('show'); }

  // UI initial
  hideModal(productFormModal);
  hideModal(cameraModal);
  hideModal(maintModal);
  productDetailCard.classList.add('hide');

  // ---- Authentication ----
  btnOpenLogin.addEventListener('click', () => {
    // focus login area: open small login prompt (browser's built-in now)
    // We'll show a browser prompt for e-mail/senha to keep UI minimal for login flow.
    const email = prompt('E-mail (demo: admin@teste.com)');
    const pass = prompt('Senha (demo: 123456)');
    if (!email || !pass) return;
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(() => {
      return auth.signInWithEmailAndPassword(email.trim(), pass);
    }).catch(err => alert('Erro login: ' + err.message));
  });

  btnLogout.addEventListener('click', () => {
    auth.signOut();
  });

  // cria conta demo silenciosa (se não existir)
  async function ensureDemoAccount() {
    const DEMO_EMAIL = 'admin@teste.com';
    const DEMO_PASS = '123456';
    try {
      await auth.createUserWithEmailAndPassword(DEMO_EMAIL, DEMO_PASS);
      console.log('Conta demo criada');
    } catch (err) {
      if (err.code !== 'auth/email-already-in-use') console.warn('Demo create:', err.message);
    }
  }
  ensureDemoAccount();

  // auth state listener
  auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
      sidebarUser.textContent = user.email;
      statUser.textContent = user.email;
      btnLogout.classList.remove('hide');
      btnOpenLogin.classList.add('hide');
      startProductsListener();
    } else {
      sidebarUser.textContent = 'Não logado';
      statUser.textContent = '—';
      btnLogout.classList.add('hide');
      btnOpenLogin.classList.remove('hide');
      stopProductsListener();
      productTable.innerHTML = '<tr><td colspan="5" class="small">Faça login para ver produtos</td></tr>';
      productCount.textContent = '0 produtos';
      statProducts.textContent = '0';
      statPhotos.textContent = '0';
      productDetailCard.classList.add('hide');
    }
  });

  // ---- Products listener (realtime) ----
  function startProductsListener() {
    if (productsUnsub) productsUnsub();
    productsUnsub = db.collection('produtos').orderBy('createdAt','desc').onSnapshot(snap => {
      const arr = [];
      snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }));
      renderProductTable(arr);
    }, err => console.error('products snapshot', err));
  }
  function stopProductsListener() {
    if (productsUnsub) { productsUnsub(); productsUnsub = null; }
  }

  // render table
  function renderProductTable(items) {
    if (!items.length) {
      productTable.innerHTML = '<tr><td colspan="5" class="small">Nenhum produto</td></tr>';
      productCount.textContent = '0 produtos';
      statProducts.textContent = '0';
      return;
    }
    productCount.textContent = `${items.length} produtos`;
    statProducts.textContent = `${items.length}`;
    productTable.innerHTML = items.map(p => `
      <tr>
        <td>${p.numero || '-'}</td>
        <td>${p.equipamento || '-'}</td>
        <td>${p.setor || '-'}</td>
        <td>${(p.fotos && p.fotos.length) ? '<img class="photo-thumb" src="'+p.fotos[0]+'">' : '-'}</td>
        <td>
          <button class="btn-ghost" data-action="view" data-id="${p.id}">Ver</button>
          <button class="btn-ghost" data-action="del" data-id="${p.id}">Excluir</button>
        </td>
      </tr>
    `).join('');

    // attach events
    productTable.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', async (ev) => {
        const id = b.dataset.id;
        const action = b.dataset.action;
        if (action === 'view') await openProductDetail(id);
        if (action === 'del') await deleteProduct(id);
      });
    });
  }

  // ---- New product flow ----
  btnNewProduct.addEventListener('click', () => {
    showModal(productFormModal);
    stagedFiles = [];
    stagedPreview.innerHTML = '';
    document.getElementById('formTitle').textContent = 'Novo Produto';
  });

  closeProductForm.addEventListener('click', () => hideModal(productFormModal));
  selectFilesBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    stagedFiles = stagedFiles.concat(files);
    renderStagedPreview();
    e.target.value = '';
  });

  function renderStagedPreview() {
    stagedPreview.innerHTML = '';
    stagedFiles.forEach((f, idx) => {
      const url = URL.createObjectURL(f);
      const img = document.createElement('img');
      img.src = url;
      img.className = 'photo-thumb';
      img.title = 'Clique para remover';
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => { stagedFiles.splice(idx,1); renderStagedPreview(); });
      stagedPreview.appendChild(img);
    });
  }

  openCameraBtn.addEventListener('click', async () => {
    await openCamera();
  });

  // when camera captured, push into stagedFiles (for new product flow)
  window.addEventListener('camera:capture', (ev) => {
    const blob = ev.detail.blob;
    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
    stagedFiles.push(file);
    renderStagedPreview();
  });

  // Save new product
  saveProductBtn.addEventListener('click', async () => {
    const numero = numeroInput.value.trim();
    const equipamento = equipamentoInput.value.trim();
    const setor = setorInput.value.trim();
    const config = configInput.value.trim();
    if (!numero || !equipamento) { alert('Preencha Nº Patrimônio e Equipamento'); return; }

    try {
      const docRef = await db.collection('produtos').add({
        numero, equipamento, setor, configuracao: config || '',
        fotos: [], createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      const pid = docRef.id;
      // upload staged files
      if (stagedFiles.length) {
        await uploadFilesForProduct(pid, stagedFiles, (i,pct) => {
          // opcional: progress UI
          console.log(`file ${i} ${pct.toFixed(1)}%`);
        });
      }
      alert('Produto criado');
      // cleanup
      numeroInput.value = equipamentoInput.value = setorInput.value = configInput.value = '';
      stagedFiles = [];
      stagedPreview.innerHTML = '';
      hideModal(productFormModal);
    } catch (err) {
      console.error('Erro salvar produto', err);
      alert('Erro ao salvar: ' + err.message);
    }
  });

  // ---- Product detail view ----
  async function openProductDetail(productId) {
    currentProductId = productId;
    try {
      const doc = await db.collection('produtos').doc(productId).get();
      if (!doc.exists) { alert('Produto não encontrado'); return; }
      const data = doc.data();
      detailName.textContent = data.equipamento || 'Sem nome';
      detailSubtitle.textContent = `Nº ${data.numero || '-'} — Setor ${data.setor || '-'}`;
      // photos
      detailPhotos.innerHTML = '';
      const fotos = data.fotos || [];
      statPhotos.textContent = (parseInt(statPhotos.textContent) || 0) + fotos.length; // opcional agregação
      if (fotos.length) {
        fotos.forEach(u => {
          const img = document.createElement('img');
          img.src = u;
          img.className = 'photo-thumb';
          detailPhotos.appendChild(img);
        });
      } else {
        detailPhotos.innerHTML = '<div class="small">Nenhuma foto</div>';
      }

      // maintenance
      maintList.innerHTML = 'Carregando...';
      const entries = await getMaintenance(productId);
      renderMaint(entries);

      productDetailCard.classList.remove('hide');
      productDetailCard.scrollIntoView({behavior:'smooth'});
    } catch (err) {
      console.error(err);
    }
  }

  function renderMaint(entries) {
    if (!entries.length) { maintList.innerHTML = '<div class="small">Nenhuma manutenção</div>'; return; }
    maintList.innerHTML = entries.map(e => {
      const d = e.dateISO ? new Date(e.dateISO).toLocaleDateString() : '';
      return `<div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03)"><strong>${d}</strong><div class="small">${e.descricao}</div><div class="small">Por: ${e.user || '-'}</div></div>`;
    }).join('');
  }

  // ---- Add photo directly to product (camera flow) ----
  btnAddPhotoToProduct.addEventListener('click', async () => {
    if (!currentProductId) { alert('Selecione um produto'); return; }
    await openCamera();
    // when camera:capture event fires, the global listener below handles upload directly
  });

  // When camera captured and a product is selected => upload and refresh detail
  window.addEventListener('camera:capture', async (ev) => {
    const blob = ev.detail.blob;
    if (!currentProductId) return; // if we're in new-product flow, stagedFiles handler already added it
    try {
      await uploadPhotoForProduct(currentProductId, blob, pct => console.log('upload', pct));
      await openProductDetail(currentProductId);
      alert('Foto adicionada ao produto');
    } catch (err) {
      console.error('Erro upload foto', err);
      alert('Erro upload: ' + err.message);
    }
  });

  // ---- Maintenance modal flow ----
  btnOpenMaintModal.addEventListener('click', () => {
    if (!currentProductId) { alert('Selecione um produto'); return; }
    maintDate.value = new Date().toISOString().split('T')[0];
    maintDesc.value = '';
    showModal(maintModal);
  });
  closeMaintBtn.addEventListener('click', () => hideModal(maintModal));

  saveMaintBtn.addEventListener('click', async () => {
    const dateISO = maintDate.value ? new Date(maintDate.value).toISOString() : new Date().toISOString();
    const descricao = maintDesc.value.trim();
    if (!descricao) { alert('Descreva a manutenção'); return; }
    try {
      await addMaintenance(currentProductId, { dateISO, descricao, user: currentUser.email });
      hideModal(maintModal);
      const entries = await getMaintenance(currentProductId);
      renderMaint(entries);
      alert('Manutenção registrada');
    } catch (err) {
      console.error(err);
      alert('Erro manutenção: ' + err.message);
    }
  });

  // ---- Delete product (basic) ----
  async function deleteProduct(productId) {
    if (!confirm('Excluir produto? Os arquivos no Storage não serão removidos automaticamente aqui.')) return;
    try {
      // opcional: deleteAllPhotosForProduct(productId) // cuidado com custos ao listar e apagar
      await db.collection('produtos').doc(productId).delete();
      // opcional: remove subcollection manutencoes (não trivial: requer batch)
      alert('Produto excluído');
      productDetailCard.classList.add('hide');
    } catch (err) {
      console.error(err);
      alert('Erro excluir: ' + err.message);
    }
  }

  // ---- Utility: online status ----
  function updateOnline() {
    document.getElementById('onlineStatus').textContent = 'Conexão: ' + (navigator.onLine ? 'Online' : 'Offline');
  }
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
  updateOnline();

  // ---- Expose currentUser for maintenance functions ----
  setInterval(() => { currentUser = auth.currentUser; }, 1000);

})();
