// manutencao.js
(function(){
  if (!window.db) {
    console.error('manutencao: Firestore não inicializado');
    return;
  }

  window.addMaintenance = async function(productId, { dateISO, descricao, user }) {
    if (!productId) throw new Error('productId ausente');
    const col = db.collection('produtos').doc(productId).collection('manutencoes');
    const entry = { dateISO: dateISO || new Date().toISOString(), descricao: descricao || '', user: user || null, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
    const docRef = await col.add(entry);
    return { id: docRef.id, ...entry };
  };

  window.getMaintenance = async function(productId) {
    if (!productId) return [];
    const snap = await db.collection('produtos').doc(productId).collection('manutencoes').orderBy('createdAt', 'desc').get();
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    return items;
  };
})();
