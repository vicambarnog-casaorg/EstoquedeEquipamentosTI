let stream;

function openCameraModal(isExtra = false) {
    window.isExtraPhoto = isExtra;
    document.getElementById("cameraModal").style.display = "flex";

    navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
        stream = s;
        document.getElementById("cameraVideo").srcObject = s;
    });
}

function fecharCameraModal() {
    document.getElementById("cameraModal").style.display = "none";
    if (stream) stream.getTracks().forEach(t => t.stop());
}

async function capturarFoto() {
    const video = document.getElementById("cameraVideo");

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
        await appRecebeFoto(blob);
        fecharCameraModal();
    }, "image/jpeg", 0.9);
}

window.openCameraModal = openCameraModal;
window.capturarFoto = capturarFoto;
window.fecharCameraModal = fecharCameraModal;
