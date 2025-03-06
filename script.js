document.getElementById("fileInput").addEventListener("change", handleFile);
document.getElementById("downloadBtn").addEventListener("click", downloadImage);

let colorTable = {};

// 2つのJSONファイルをロードし、データを統合
Promise.all([
    fetch('color_table_part1.json').then(response => response.json()),
    fetch('color_table_part2.json').then(response => response.json())
]).then(([data1, data2]) => {
    colorTable = { ...data1, ...data2 };
}).catch(error => console.error("JSONファイルの読み込みエラー:", error));

function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    if (file.type.startsWith("image/")) {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            applyColorTransform(ctx, canvas.width, canvas.height);
        };
        img.src = URL.createObjectURL(file);
    } else if (file.type.startsWith("video/")) {
        const video = document.getElementById("video");
        video.src = URL.createObjectURL(file);
        video.hidden = false;
        video.play();

        video.onloadeddata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            drawVideoFrame(video, ctx, canvas);
        };
    }
}

function drawVideoFrame(video, ctx, canvas) {
    if (video.paused || video.ended) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    applyColorTransform(ctx, canvas.width, canvas.height);
    requestAnimationFrame(() => drawVideoFrame(video, ctx, canvas));
}

function applyColorTransform(ctx, width, height) {
    let imageData = ctx.getImageData(0, 0, width, height);
    let data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i+1], b = data[i+2];
        let key = `${r},${g},${b}`;

        if (colorTable[key]) {
            let [newR, newG, newB] = colorTable[key].split(',').map(Number);
            data[i] = newR;
            data[i+1] = newG;
            data[i+2] = newB;
        } else {
            let nearestColor = findNearestColor(r, g, b);
            data[i] = nearestColor[0];
            data[i+1] = nearestColor[1];
            data[i+2] = nearestColor[2];
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

function findNearestColor(r, g, b) {
    let minDistance = Infinity;
    let closestColor = [r, g, b];

    for (let key in colorTable) {
        let [cr, cg, cb] = key.split(',').map(Number);
        let distance = Math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2);

        if (distance < minDistance) {
            minDistance = distance;
            closestColor = colorTable[key].split(',').map(Number);
        }
    }

    return closestColor;
}

function downloadImage() {
    const canvas = document.getElementById("canvas");
    const link = document.createElement("a");
    link.download = "converted_image.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}
