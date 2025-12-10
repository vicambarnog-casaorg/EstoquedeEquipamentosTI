// app.js
(function(){
  // UI refs
  const loginBox = document.getElementById('loginBox');
  const btnLogin = document.getElementById('btnLogin');
  const btnDemo = document.getElementById('btnDemo');
  const emailInput = document.getElementById('emailLogin');
  const passInput = document.getElementById('senhaLogin');
  const loginMsg = document.getElementById('loginMsg');

  const appLayout = document.getElementById('appLayout');
  const sidebarUser = document.getElementById('sidebarUser');
  const btnLogout = document.getElementById('btnLogout');

  const productTableBody = document.getElementById('productTableBody');
  const statItems = document.getElementById('statItems');
  const statPhotos = document.getElementById('statPhotos');
  const statUser = document.getElementById('statUser');

  const btnNewProduct = document.getElementById('btnNewProduct');
  const productFormModal = document.getElementById('productFormModal');
  const closeFormBtn = document.getElementById('closeFormBtn');
  const numeroInput = document.getElementById('numeroInput');
  const equipamentoInput = document.getElementById('equipamentoInput');
  const setorInput = document.getElementById('setorInput');
  const openCameraBtn = document.getElementById('openCameraBtn');
  const selectFilesBtn = document.getElementById('selectFilesBtn');
  const fileInput = document.getElementById('fileInput');
  const stagedPreview = document.getElementById('stagedPreview');
  const saveProductBtn = document.getElementById('saveProductBtn');

  const productDetailCard = document.getElementById('productDetailCard');
  const detailTitle = document.getElementById('detailTitle');
  const detailSubtitle = document.getElementById('detailSubtitle');
  const detailPhotos = document.getElementById('detailPhotos');
  const btnAddPhoto = document.getElementById('btnAddPhoto');
  const btnAddMaint = document.getElementById('btnAddMaint');
  const maintenanceList = document.getElementById('maintenanceList');

  // modals camera & maintenance
  const cameraModal = document.getElementById('cameraModal');
  const captureBtn = document.getElementById('captureBtn');
  const closeCameraBtn = document.getElementById('closeCameraBtn');
  const maintModal = document.getElementById('maintModal');
  const closeMaintBtn = document.getElementById('closeMaintBtn');
  const saveMaintBtn = document.getElementById('saveMaintBtn');
  const maintDate = document.getElementById('maintDate');
  const maintDesc = document.getElementById('maintDesc');

  // state
  let currentUser = null;
  let productsUnsub = null;
  let stagedFiles = [];
  let currentProductId = null;

  // helper show/hide
  function show(el){ el.classList.remove('hidden'); }
  function hide(el){ el.classList.add('hidden'); }
  function showModal(el){ el.classList.add('show'); el.setAttribute('aria-hidden','false'); }
  function hideModal(el){ el.classList.remove('show'); el.setAttribute('aria-hidden','true'); }

  // Auth handlers
  btnLogin.addEventListener('click', async () => {
    loginMsg.style.display = 'none';
    try {
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      await auth.signInWithEmailAndPassword(emailInput.value.trim(), passInput.value.trim());
    } catch (err) {
      loginMsg.style.display = 'block';
      loginMsg.textContent = err.message;
    }
  });

  btnDemo.addEventListener('click', async () => {
    const DEMO_EMAIL = 'admin@teste.com';
    const DEMO_PASS = '123456';
    try {
      await auth.createUserWithEmailAndPassword(DEMO_EMAIL, DEMO_PASS);
      alert('Conta demo criada. Entre com admin@teste.com / 123456');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') alert('Conta demo já existe, faça login.');
      else alert('Erro criar demo: ' + err.message);
    }
  });

  btnLogout.addEventListener('click', () => auth.signOut());

  auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
      loginBox.style.display = 'none';
      appLayout.classList.remove('hidden');
      appLayout.setAttribute('aria-hidden','false');
      sidebarUser.textContent = user.email;
      statUser.textContent = user.email;
      btnLogout.classList.remove('hidden');
      startProductsListener();
    } else {
      loginBox.style.display = '';
      appLayout.classList.add('hidden');
      appLayout.setAttribute('aria-hidden','true');
      sidebarUser.textContent = 'Não logado';
      statUser.textContent = '—';
      btnLogout.classList.add('hidden');
      stopProductsListener();
    }
  });

  // Firestore listener
  function startProductsListener() {
    if (productsUnsub) productsUnsub();
    productsUnsub = db.collection('produtos').orderBy('criado','desc').onSnapshot(snap => {
      const items = [];
      snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      renderTable(items);
    }, err => {
      console.error('products snapshot', err);
    });
  }

  function stopProductsListener() {
    if (productsUnsub) { productsUnsub(); productsUnsub = null; }
    productTableBody.innerHTML = '<tr><td colspan="5" class="small">Faça login</td></tr>';
  }

  function renderTable(items) {
    if (!items.length) {
      productTableBody.innerHTML = '<tr><td colspan="5" class="small">Nenhum produto</td></tr>';
      statItems.textContent = '0';
      return;
    }
    statItems.textContent = String(items.length);
    productTableBody.innerHTML = items.map(p => `
      <tr>
        <td>${p.numero || p.patrimonio || '-'}</td>
        <td>${p.equipamento || '-'}</td>
        <td>${p.setor || '-'}</td>
        <td>${(p.fotos && p.fotos.length) ? '<img class="photo-thumb" src="'+p.fotos[0]+'">' : '-'}</td>
        <td>
          <button class="btn-ghost" data-id="${p.id}" data-action="view">Ver</button>
          <button class="btn-ghost" data-id="${p.id}" data-action="delete">Excluir</button>
        </td>
      </tr>
    `).join('');

    // attach events
    productTableBody.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', (ev) => {
        const id = b.dataset.id;
        const action = b.dataset.action;
        if (action === 'view') openDetail(id);
        if (action === 'delete') deleteProduct(id);
      });
    });
  }

  // New product flow
  btnNewProduct.addEventListener('click', () => {
    document.getElementById('formTitle').textContent = 'Novo Produto';
    numeroInput.value=''; equipamentoInput.value=''; setorInput.value='';
    stagedFiles = []; stagedPreview.innerHTML=''; currentProductId=null;
    showModal(productFormModal);
  });

  closeFormBtn.addEventListener('click', () => hideModal(productFormModal));

  selectFilesBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    const files = Array.from(e.target.files);
    stagedFiles = stagedFiles.concat(files);
    renderStaged();
    fileInput.value='';
  });

  function renderStaged(){
    stagedPreview.innerHTML = '';
    stagedFiles.forEach((f,idx) => {
      const url = URL.createObjectURL(f);
      const img = document.createElement('img');
      img.src = url; img.width = 120; img.style.margin='4px'; img.style.cursor='pointer';
      img.title = 'Clique para remover';
      img.addEventListener('click', ()=> { stagedFiles.splice(idx,1); renderStaged(); });
      stagedPreview.appendChild(img);
    });
  }

  openCameraBtn.addEventListener('click', () => openCameraModal());

  // camera captured -> either staged (new product) or direct upload (editing product)
  window.addEventListener('camera:captured', async (ev) => {
    const blob = ev.detail.blob;
    if (currentProductId) {
      try {
        const url = await uploadImageCloudinary(blob);
        await db.collection('produtos').doc(currentProductId).update({ fotos: firebase.firestore.FieldValue.arrayUnion(url) });
        await openDetail(currentProductId);
        alert('Foto adicionada ao produto');
      } catch (err) {
        console.error(err); alert('Erro upload: ' + err.message);
      }
    } else {
      stagedFiles.push(new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' }));
      renderStaged();
    }
  });

  // save product
  saveProductBtn.addEventListener('click', async () => {
    const numero = numeroInput.value.trim() || null;
    const equipamento = equipamentoInput.value.trim() || null;
    const setor = setorInput.value.trim() || null;
    if (!numero || !equipamento) { alert('Preencha Nº e Equipamento'); return; }
    try {
      const docRef = await db.collection('produtos').add({ numero, equipamento, setor, fotos: [], criado: firebase.firestore.FieldValue.serverTimestamp() });
      const pid = docRef.id;
      if (stagedFiles.length) {
        for (let i=0;i<stagedFiles.length;i++){
          const file = stagedFiles[i];
          const url = await uploadImageCloudinary(file);
          await db.collection('produtos').doc(pid).update({ fotos: firebase.firestore.FieldValue.arrayUnion(url) });
        }
      }
      hideModal(productFormModal);
      alert('Produto salvo');
    } catch (err) {
      console.error('Erro salvar', err);
      alert('Erro ao salvar produto: ' + err.message);
    }
  });

  // open product detail
  async function openDetail(id) {
    currentProductId = id;
    try {
      const doc = await db.collection('produtos').doc(id).get();
      if (!doc.exists) { alert('Produto não encontrado'); return; }
      const data = doc.data();
      detailTitle.textContent = data.equipamento || '-';
      detailSubtitle.textContent = `Nº ${data.numero || '-'} • Setor: ${data.setor || '-'}`;
      detailPhotos.innerHTML = '';
      (data.fotos || []).forEach(u => {
        const img = document.createElement('img');
        img.src = u; img.width = 140; img.style.margin='6px';
        detailPhotos.appendChild(img);
      });
      // load maintenance
      maintenanceList.innerHTML = 'Carregando...';
      const entries = await getMaintenance(id);
      if (!entries.length) maintenanceList.innerHTML = '<div class="small">Nenhuma manutenção</div>';
      else maintenanceList.innerHTML = entries.map(e=>`<div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03)"><strong>${new Date(e.dateISO).toLocaleDateString()}</strong><div class="small">${e.descricao}</div><div class="small">Por: ${e.user || '-'}</div></div>`).join('');
      show(productDetailCard);
      productDetailCard.scrollIntoView({behavior:'smooth'});
    } catch (err) { console.error(err); alert('Erro abrir detalhe'); }
  }

  // add photo button -> open camera for current product
  btnAddPhoto.addEventListener('click', async () => {
    if (!currentProductId) { alert('Abra um produto primeiro'); return; }
    openCameraModal();
  });

  // delete product
  async function deleteProduct(id) {
    if (!confirm('Excluir produto?')) return;
    try {
      await db.collection('produtos').doc(id).delete();
      alert('Produto excluído');
      productDetailCard.classList.add('hidden');
    } catch (err) { console.error(err); alert('Erro excluir'); }
  }

  // maintenance modal
  btnAddMaint.addEventListener('click', ()=> {
    if (!currentProductId) { alert('Abra um produto'); return; }
    showModal(maintModal);
    maintDate.value = new Date().toISOString().split('T')[0];
    maintDesc.value = '';
  });
  closeMaintBtn.addEventListener('click', ()=> hideModal(maintModal));
  saveMaintBtn.addEventListener('click', async () => {
    const dateISO = maintDate.value ? new Date(maintDate.value).toISOString() : new Date().toISOString();
    const descricao = maintDesc.value.trim();
    if (!descricao) { alert('Descreva a manutenção'); return; }
    try {
      await addMaintenance(currentProductId, { dateISO, descricao, user: currentUser.email });
      hideModal(maintModal);
      await openDetail(currentProductId);
      alert('Manutenção salva');
    } catch (err) { console.error(err); alert('Erro salvar manutenção'); }
  });

  // utility: close camera modal from outside UI (camera.js)
  window.addEventListener('closeCamera', ()=> { /* optional hook */ });

  // initial UI state
  hide(productDetailCard);
})();
