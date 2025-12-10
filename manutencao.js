// manutencao.js
// Funções para adicionar e ler histórico de manutenção por produto
(function(){
  if (!window.db) {
    console.error('manutencao.js: firebase não inicializado');
    return;
  }

  /**
   * addMaintenance(productId, {dateISO, descricao, user})
   * retorna entry salvo
   */
  window.addMaintenance = async function(productId, { dateISO, descricao, user }) {
    if (!productId) throw new Error('productId necessário');
    const colRef = window.db.collection('produtos').doc(productId).collection('manutencoes');
    const entry = {
      dateISO: dateISO || new Date().toISOString(),
      descricao: descricao || '',
      user: user || null,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    };
    const res = await colRef.add(entry);
    return { id: res.id, ...entry };
  };

  /**
   * getMaintenance(productId) => array de entries ordenadas por createdAt desc
   */
  window.getMaintenance = async function(productId) {
    if (!productId) throw new Error('productId necessário');
    const colRef = window.db.collection('produtos').doc(productId).collection('manutencoes').orderBy('createdAt','desc');
    const snap = await colRef.get();
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    return list;
  };
})();
