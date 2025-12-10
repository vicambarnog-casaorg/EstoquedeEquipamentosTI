let fotosTemp = [];
let produtoAtual = null;

/* LOGIN */
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById("loginArea").classList.add("hidden");
        document.getElementById("dashboard").classList.remove("hidden");
        carregarProdutos();
    } else {
        document.getElementById("loginArea").classList.remove("hidden");
        document.getElementById("dashboard").classList.add("hidden");
    }
});

async function login() {
    const email = emailLogin.value;
    const senha = senhaLogin.value;

    await auth.signInWithEmailAndPassword(email, senha).catch(e => alert(e));
}

function logout() { auth.signOut(); }

/* MOSTRAR SEÇÕES */
function mostrarLista() {
    tituloTopo.textContent = "Lista de Produtos";
    listaArea.classList.remove("hidden");
    cadastroArea.classList.add("hidden");
    detalhesArea.classList.add("hidden");
}

function mostrarCadastro() {
    tituloTopo.textContent = "Cadastrar Produto";
    listaArea.classList.add("hidden");
    cadastroArea.classList.remove("hidden");
    detalhesArea.classList.add("hidden");
}

/* SALVAR PRODUTO */
async function salvarProduto() {
    const data = {
        patrimonio: patrimonio.value,
        equipamento: equipamento.value,
        setor: setor.value,
        fotos: [],
        criado: Date.now()
    };

    const docRef = await db.collection("patrimonio").add(data);

    for (const foto of fotosTemp) {
        const url = await uploadImageToImageKit(foto);
        await docRef.update({
            fotos: firebase.firestore.FieldValue.arrayUnion(url)
        });
    }

    fotosTemp = [];
    mostrarLista();
    carregarProdutos();
}

/* RECEBE FOTO DA CAMERA */
async function appRecebeFoto(blob) {
    if (window.isExtraPhoto && produtoAtual) {
        const url = await uploadImageToImageKit(blob);
        await db.collection("patrimonio").doc(produtoAtual).update({
            fotos: firebase.firestore.FieldValue.arrayUnion(url)
        });
        abrirDetalhes(produtoAtual);
        return;
    }

    fotosTemp.push(blob);
    previewFotos.innerHTML += `<img src="${URL.createObjectURL(blob)}" width="120" style="margin:5px;">`;
}

/* CARREGAR LISTA */
async function carregarProdutos() {
    const tbody = document.querySelector("#tabelaProdutos tbody");
    tbody.innerHTML = "";

    const snap = await db.collection("patrimonio").orderBy("criado", "desc").get();

    snap.forEach(doc => {
        const p = doc.data();
        const foto = p.fotos?.[0] || "";

        tbody.innerHTML += `
            <tr>
                <td>${p.patrimonio}</td>
                <td>${p.equipamento}</td>
                <td>${p.setor}</td>
                <td>${foto ? `<img src="${foto}" width="60">` : "-"}</td>
                <td>
                    <button onclick="abrirDetalhes('${doc.id}')">Abrir</button>
                </td>
            </tr>
        `;
    });
}

/* DETALHES */
async function abrirDetalhes(id) {
    produtoAtual = id;

    const doc = await db.collection("patrimonio").doc(id).get();
    const p = doc.data();

    detalhesTitulo.textContent = p.equipamento;
    detalhesPat.textContent = p.patrimonio;
    detalhesSetor.textContent = p.setor;

    listaFotos.innerHTML = p.fotos.map(f => `<img src="${f}" width="150" style="margin:5px;">`).join("");

    listaManutencao.innerHTML = await carregarManutencoes(id);

    listaArea.classList.add("hidden");
    cadastroArea.classList.add("hidden");
    detalhesArea.classList.remove("hidden");
}

/* MANUTENÇÃO */
function abrirModalManutencao() {
    manutencaoModal.style.display = "flex";
}

function fecharManutencaoModal() {
    manutencaoModal.style.display = "none";
}

async function salvarManutencao() {
    await adicionarManutencao(produtoAtual, manutencaoTexto.value);
    manutencaoTexto.value = "";
    fecharManutencaoModal();
    abrirDetalhes(produtoAtual);
}
