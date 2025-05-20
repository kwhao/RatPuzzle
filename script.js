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


// 功能切换逻辑
document.querySelectorAll('.modeButton').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.modeButton').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        const mode = this.dataset.mode;
        if (mode === 'merge') {
            document.getElementById('mergeSection').style.display = 'block';
            document.getElementById('splitSection').style.display = 'none';
        } else {
            document.getElementById('mergeSection').style.display = 'none';
            document.getElementById('splitSection').style.display = 'block';
        }
    });
});

// 监听分片数量变化
const splitCountInput = document.getElementById('splitCount');
const splitCountWarning = document.getElementById('splitCountWarning');

splitCountInput.addEventListener('input', function() {
    const splitCount = parseInt(this.value);
    if (splitCount < 4) {
        splitCountWarning.style.display = 'block';
    } else {
        splitCountWarning.style.display = 'none';
    }
});

// 打散碎片功能
document.getElementById('splitButton').addEventListener('click', async function() {
    const fileInput = document.getElementById('splitImageInput');
    const file = fileInput.files[0];
    if (!file) {
        alert('请选择一张图片');
        return;
    }

    try {
        const splitCount = parseInt(document.getElementById('splitCount').value);
        if (splitCount === 0) {
            alert('分片数量不能为 0，请重新输入。');
            return;
        }
        const negativeEffect = document.getElementById('negativeEffect').checked;
        const previewContainer = document.getElementById('splitPreviewContainer');
        previewContainer.innerHTML = '';

        const img = await loadImage(URL.createObjectURL(file));
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        if (negativeEffect) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
            ctx.putImageData(imageData, 0, 0);
        }

        // 将图片划分为小方格
        const gridSize = 10; // 小方格大小，可以根据需要调整
        const gridX = Math.ceil(canvas.width / gridSize);
        const gridY = Math.ceil(canvas.height / gridSize);
        const gridCells = [];
    
        for (let y = 0; y < gridY; y++) {
            for (let x = 0; x < gridX; x++) {
                gridCells.push({ x: x * gridSize, y: y * gridSize });
            }
        }
    
        // 创建碎片图
        const fragmentCanvases = Array.from({ length: splitCount }, () => {
            const fragmentCanvas = document.createElement('canvas');
            const fragmentCtx = fragmentCanvas.getContext('2d');
            fragmentCanvas.width = canvas.width;
            fragmentCanvas.height = canvas.height;
            fragmentCtx.fillStyle = 'white';
            fragmentCtx.fillRect(0, 0, canvas.width, canvas.height);
            return fragmentCanvas;
        });
    
        // 更随机地分配小方格到各个碎片图
        gridCells.forEach((cell) => {
            const randomIndex = Math.floor(Math.random() * splitCount);
            const fragmentCanvas = fragmentCanvases[randomIndex];
            const fragmentCtx = fragmentCanvas.getContext('2d');
    
            fragmentCtx.drawImage(
                canvas,
                cell.x, cell.y, gridSize, gridSize,
                cell.x, cell.y, gridSize, gridSize
            );
        });
    
        // 生成预览和下载按钮
        fragmentCanvases.forEach((fragmentCanvas, index) => {
            const fragmentUrl = fragmentCanvas.toDataURL();
            
            // 创建容器
            const container = document.createElement('div');
            container.style.border = '1px solid #ccc';
            container.style.padding = '10px';
            container.style.margin = '10px';
            container.style.borderRadius = '8px';
    
            // 添加图片序号
            const indexLabel = document.createElement('p');
            indexLabel.textContent = `大老鼠碎片${index + 1}`;
            container.appendChild(indexLabel);
    
            // 创建图片元素
            const imgElement = document.createElement('img');
            imgElement.src = fragmentUrl;
            imgElement.className = 'previewImage';
            container.appendChild(imgElement);
    
            // 创建下载按钮
            const downloadButton = document.createElement('button');
            downloadButton.textContent = '导出碎片';
            downloadButton.addEventListener('click', () => {
                const link = document.createElement('a');
                link.download = `fragment_${index}.png`;
                link.href = fragmentUrl;
                link.click();
            });
            container.appendChild(downloadButton);
    
            previewContainer.appendChild(container);
        });
    
        // 移除旧的批量下载事件监听器
        const batchDownloadButton = document.getElementById('batchDownloadButton');
        if (batchDownloadButton.hasAttribute('data-event-attached')) {
            batchDownloadButton.removeEventListener('click', batchDownload);
        }
    
        // 定义批量下载函数
        function batchDownload() {
            fragmentCanvases.forEach((fragmentCanvas, index) => {
                const link = document.createElement('a');
                link.download = `fragment_${index}.png`;
                link.href = fragmentCanvas.toDataURL();
                link.click();
            });
        }
    
        // 添加新的批量下载事件监听器
        batchDownloadButton.addEventListener('click', batchDownload);
        batchDownloadButton.setAttribute('data-event-attached', 'true');
    
        // 批量下载功能
        document.getElementById('batchDownloadButton').addEventListener('click', () => {
            fragmentCanvases.forEach((fragmentCanvas, index) => {
                const link = document.createElement('a');
                link.download = `fragment_${index}.png`;
                link.href = fragmentCanvas.toDataURL();
                link.click();
            });
        });

    } catch (error) {
        console.error('打散碎片出错:', error);
        alert('打散碎片出错，请检查控制台日志。');
    }
});

// 添加图片预览功能
document.getElementById('splitImageInput').addEventListener('change', function(e) {
    const previewContainer = document.getElementById('splitImagePreview');
    previewContainer.innerHTML = '';

    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = document.createElement('img');
            img.src = event.target.result;
            img.className = 'previewImage';
            previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
});