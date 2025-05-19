document.getElementById('imageInput').addEventListener('change', function(e) {
    const previewContainer = document.getElementById('previewContainer');
    previewContainer.innerHTML = '';

    const files = e.target.files;
    // 更新显示的图片数量
    const imageCountElement = document.getElementById('imageCount');
    imageCountElement.textContent = `已上传图片数量: ${files.length}`;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.className = 'previewImage';
                previewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    }
});

document.getElementById('mergeButton').addEventListener('click', async function() {
    const files = document.getElementById('imageInput').files;
    if (files.length === 0) {
        alert('请选择图片文件');
        return;
    }

    const mergeMode = document.getElementById('mergeMode').value;
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');

    try {
        const firstImage = await loadImage(URL.createObjectURL(files[0]));
        canvas.width = firstImage.width;
        canvas.height = firstImage.height;
        ctx.drawImage(firstImage, 0, 0);

        for (let i = 1; i < files.length; i++) {
            const nextImage = await loadImage(URL.createObjectURL(files[i]));
            if (mergeMode === 'max') {
                ctx.globalCompositeOperation = 'lighter';
            } else if (mergeMode === 'min') {
                ctx.globalCompositeOperation = 'multiply';
            }
            ctx.drawImage(nextImage, 0, 0);
        }

        const mergedImage = new Image();
        mergedImage.src = canvas.toDataURL();
        const mergedImageContainer = document.getElementById('mergedImageContainer');
        mergedImageContainer.innerHTML = '<h2>碎片合成啦</h2>';
        mergedImageContainer.appendChild(mergedImage);

    } catch (error) {
        console.error('图片处理出错:', error);
        alert('图片处理出错，请检查控制台日志。');
    }
});

document.getElementById('negativeButton').addEventListener('click', function() {
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i]; // 红色通道
        data[i + 1] = 255 - data[i + 1]; // 绿色通道
        data[i + 2] = 255 - data[i + 2]; // 蓝色通道
    }

    ctx.putImageData(imageData, 0, 0);

    const negativeImage = new Image();
    negativeImage.src = canvas.toDataURL();
    const negativeImageContainer = document.getElementById('negativeImageContainer');
    negativeImageContainer.innerHTML = '<h2>反反反</h2>';
    negativeImageContainer.appendChild(negativeImage);
});

// 辅助函数：加载图片并返回 Promise
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}