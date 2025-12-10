console.log("app.js carregado");

// ELEMENTOS PRINCIPAIS
const loginBox = document.getElementById("loginBox");
const appLayout = document.getElementById("appLayout");

// Login inputs
const emailLogin = document.getElementById("emailLogin");
const senhaLogin = document.getElementById("senhaLogin");
const btnLogin = document.getElementById("btnLogin");
const btnDemo = document.getElementById("btnDemo");
const loginMsg = document.getElementById("loginMsg");

// Sidebar
const sidebarUser = document.getElementById("sidebarUser");
const btnOpenLogin = document.getElementById("btnOpenLogin");
const btnLogout = document.getElementById("btnLogout");

// Navegação
const navProducts = document.getElementById("navProducts");
const navSettings = document.getElementById("navSettings");

// Dashboard topo
const pageTitle = document.getElementById("pageTitle");
const productCount = document.getElementById("productCount");
const statItems = document.getElementById("statItems");
const statPhotos = document.getElementById("statPhotos");
const statUser = document.getElementById("statUser");
const btnNewProduct = document.getElementById("btnNewProduct");

// Lista
const productTableBody = document.getElementById("productTableBody");
const listCard = document.getElementById("listCard");

// Form modal
const productFormModal = document.getElementById("productFormModal");
const closeFormBtn = document.getElementById("closeFormBtn");
const numeroInput = document.getElementById("numeroInput");
const equipamentoInput = document.getElementById("equipamentoInput");
const setorInput = document.getElementById("setorInput");
const openCameraBtn = document.getElementById("openCameraBtn");
const fileInput = document.getElementById("fileInput");
const selectFilesBtn = document.getElementById("selectFilesBtn");
const saveProductBtn = document.getElementById("saveProductBtn");
const stagedPreview = document.getElementById("stagedPreview");
const formTitle = document.getElementById("formTitle");

// Detalhes
const productDetailCard = document.getElementById("productDetailCard");
const detailTitle = document.getElementById("detailTitle");
const detailSubtitle = document.getElementById("detailSubtitle");
const detailPhotos = document.getElementById("detailPhotos");
const maintenanceList = document.getElementById("maintenanceList");

// Camera
const cameraModal = document.getElementById("cameraModal");
const closeCameraBtn = document.getElementById("closeCameraBtn");
const cameraVideo = document.getElementById("cameraVideo");
const captureBtn = document.getElementById("captureBtn");

// Manutenção
const maintModal = document.getElementById("maintModal");
const closeMaintBtn = document.getElementById("closeMaintBtn");
const maintDate = document.getElementById("maintDate");
const maintDesc = document.getElementById("maintDesc");
const saveMaintBtn = document.getElementById("saveMaintBtn");

// Estado
let currentUser = null;
let capturedPhotos = [];
let currentProductId = null;

// -----------------------------
// LOGIN
// -----------------------------

btnLogin.onclick = async () => {
    try {
        await auth.signInWithEmailAndPassword(emailLogin.value, senhaLogin.value);
        loginMsg.style.display = "none";
    } catch (e) {
        loginMsg.style.display = "block";
        loginMsg.innerText = "Erro: " + e.message;
    }
};

btnDemo.onclick = async () => {
    try {
        await auth.createUserWithEmailAndPassword(
            emailLogin.value,
            senhaLogin.value
        );
    } catch (e) {
        loginMsg.style.display = "block";
        loginMsg.innerText = e.message;
    }
};

btnLogout.onclick = () => auth.signOut();

btnOpenLogin.onclick = () => {
    loginBox.classList.remove("hidden");
    appLayout.classList.add("hidden");
};

// -----------------------------
// OBSERVADOR DE LOGIN
// -----------------------------

auth.onAuthStateChanged(async (user) => {
    currentUser = user;

    if (!user) {
        loginBox.classList.remove("hidden");
        appLayout.classList.add("hidden");
        return;
    }

    // Logado
    loginBox.classList.add("hidden");
    appLayout.classList.remove("hidden");

    sidebarUser.textContent = user.email;
    btnLogout.classList.remove("hidden");

    loadProducts();
});

// -----------------------------
// CARREGAR PRODUTOS
// -----------------------------

async function loadProducts() {
    const snap = await db.collection("produtos").get();

    productTableBody.innerHTML = "";
    detailPhotos.innerHTML = "";

    let countPhotos = 0;

    snap.forEach((doc) => {
        const p = doc.data();

        const tr = document.createElement("tr");

        const foto = p.fotos?.length ? p.fotos[0] : null;

        tr.innerHTML = `
          <td>${p.numero}</td>
          <td>${p.equipamento}</td>
          <td>${p.setor}</td>
          <td>${foto ? `<img class="photo-thumb" src="${foto}">` : "—"}</td>
          <td><button class="btn-ghost" data-id="${doc.id}">Abrir</button></td>
        `;

        productTableBody.appendChild(tr);

        if (p.fotos) countPhotos += p.fotos.length;

        tr.querySelector("button").onclick = () => openDetails(doc.id);
    });

    statItems.textContent = snap.size;
    statPhotos.textContent = countPhotos;

    productCount.textContent = `${snap.size} produtos`;
}

// -----------------------------
// ABRIR DETALHES
// -----------------------------

async function openDetails(id) {
    currentProductId = id;

    const docData = await db.collection("produtos").doc(id).get();
    const p = docData.data();

    productDetailCard.classList.remove("hidden");
    detailTitle.textContent = p.equipamento;
    detailSubtitle.textContent = `Patrimônio ${p.numero}`;

    detailPhotos.innerHTML = "";
    if (p.fotos?.length) {
        p.fotos.forEach((f) => {
            const img = document.createElement("img");
            img.src = f;
            img.className = "photo-thumb";
            detailPhotos.appendChild(img);
        });
    }

    loadMaintenance(id);
}

// -----------------------------
// FORM DE PRODUTO
// -----------------------------

btnNewProduct.onclick = () => {
    capturedPhotos = [];
    stagedPreview.innerHTML = "";
    numeroInput.value = "";
    equipamentoInput.value = "";
    setorInput.value = "";
    formTitle.textContent = "Novo produto";
    productFormModal.classList.add("show");
};

closeFormBtn.onclick = () => productFormModal.classList.remove("show");

selectFilesBtn.onclick = () => fileInput.click();

fileInput.onchange = async (ev) => {
    for (const file of ev.target.files) {
        const blob = file;
        capturedPhotos.push(blob);

        const img = document.createElement("img");
        img.className = "photo-thumb";
        img.src = URL.createObjectURL(blob);
        stagedPreview.appendChild(img);
    }
};

// -----------------------------
// CÂMERA
// -----------------------------

openCameraBtn.onclick = async () => {
    await openCamera();
    cameraModal.classList.add("show");
};

closeCameraBtn.onclick = () => cameraModal.classList.remove("show");

captureBtn.onclick = async () => {
    const blob = await capturePhoto();
    capturedPhotos.push(blob);

    const img = document.createElement("img");
    img.src = URL.createObjectURL(blob);
    img.className = "photo-thumb";
    stagedPreview.appendChild(img);

    cameraModal.classList.remove("show");
};

// -----------------------------
// SALVAR PRODUTO
// -----------------------------

saveProductBtn.onclick = async () => {
    try {
        let fotoUrls = [];

        for (const blob of capturedPhotos) {
            const url = await uploadImageCloudinary(blob);
            fotoUrls.push(url);
        }

        const novo = {
            numero: numeroInput.value,
            equipamento: equipamentoInput.value,
            setor: setorInput.value,
            fotos: fotoUrls,
            criadoEm: Date.now(),
        };

        await db.collection("produtos").add(novo);

        productFormModal.classList.remove("show");

        loadProducts();
    } catch (e) {
        alert("Erro ao salvar: " + e.message);
    }
};

// -----------------------------
// MANUTENÇÃO
// -----------------------------

btnAddMaint.onclick = () => {
    maintDate.value = new Date().toISOString().split("T")[0];
    maintDesc.value = "";
    maintModal.classList.add("show");
};

closeMaintBtn.onclick = () => maintModal.classList.remove("show");

saveMaintBtn.onclick = async () => {
    await addMaintenance(currentProductId, maintDate.value, maintDesc.value);
    maintModal.classList.remove("show");
    loadMaintenance(currentProductId);
};

// -----------------------------
// CARREGAR MANUTENÇÃO
// -----------------------------

async function loadMaintenance(id) {
    const snap = await db
        .collection("produtos")
        .doc(id)
        .collection("manutencoes")
        .orderBy("data")
        .get();

    if (snap.empty) {
        maintenanceList.textContent = "Nenhuma manutenção registrada";
        return;
    }

    maintenanceList.innerHTML = "";

    snap.forEach((doc) => {
        const m = doc.data();

        const div = document.createElement("div");
        div.innerHTML = `
            <div style="margin-bottom:8px">
              <b>${m.data}</b><br>
              ${m.descricao}
            </div>
        `;

        maintenanceList.appendChild(div);
    });
}
