async function adicionarManutencao(productId, texto) {
    await db.collection("manutencoes").add({
        productId,
        texto,
        timestamp: Date.now()
    });
}

async function carregarManutencoes(productId) {
    const snap = await db.collection("manutencoes")
        .where("productId", "==", productId)
        .orderBy("timestamp", "desc")
        .get();

    let html = "";
    snap.forEach(doc => {
        const m = doc.data();
        html += `<p><b>${new Date(m.timestamp).toLocaleString()}</b><br>${m.texto}</p><hr>`;
    });

    return html;
}

window.adicionarManutencao = adicionarManutencao;
window.carregarManutencoes = carregarManutencoes;
