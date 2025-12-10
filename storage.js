// storage.js
// Funções para upload de fotos ao Firebase Storage e associação em Firestore
(function(){
  if (!window.storage || !window.db) {
    console.error('storage.js: firebase não inicializado');
    return;
  }

  /**
   * uploadPhotoForProduct(productId, blob) => Promise<downloadURL>
   */
  window.uploadPhotoForProduct = async function(productId, blob, onProgress) {
    if (!productId) throw new Error('productId necessário');
    const filename = `${Date.now()}.jpg`;
    const path = `produtos/${productId}/photos/${filename}`;
    const ref = window.storage.ref().child(path);
    const task = ref.put(blob, { contentType: 'image/jpeg' });

    // progresso opcional
    await new Promise((resolve, reject) => {
      task.on('state_changed', snapshot => {
        if (onProgress) {
          const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(pct);
        }
      }, reject, resolve);
    });

    const url = await task.snapshot.ref.getDownloadURL();
    // adiciona URL ao array 'fotos' do documento do produto
    await window.db.collection('produtos').doc(productId).update({
      fotos: window.firebase.firestore.FieldValue.arrayUnion(url)
    });
    return url;
  };

  /**
   * uploadFilesForProduct(productId, FileList|Array<File>)
   * retorna array de URLs
   */
  window.uploadFilesForProduct = async function(productId, files, onProgressPerFile) {
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = await window.uploadPhotoForProduct(productId, file, pct => {
        if (onProgressPerFile) onProgressPerFile(i, pct);
      });
      urls.push(url);
    }
    return urls;
  };

  /**
   * opcional: apagar todas as fotos de um produto (para uso ao deletar produto)
   * retorna Promise<void>
   */
  window.deleteAllPhotosForProduct = async function(productId) {
    const listRef = window.storage.ref().child(`produtos/${productId}/photos`);
    // Nota: storage API não tem listAll em compat? tem sim:
    const listResult = await listRef.listAll();
    const deletes = listResult.items.map(i => i.delete());
    await Promise.all(deletes);
  };
})();
