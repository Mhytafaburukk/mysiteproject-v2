// Kelime Eşleştirme Testi (Dinleme özellikleri kaldırıldı, modern eşleştirme)

const wordImages = {
    'apple': 'https://img.icons8.com/color/96/apple.png',
    'book': 'https://img.icons8.com/color/96/book.png',
    'computer': 'https://img.icons8.com/color/96/imac.png',
    'elephant': 'https://img.icons8.com/color/96/elephant.png',
    'cat': 'https://img.icons8.com/color/96/cat.png',
    'dog': 'https://img.icons8.com/color/96/dog.png',
    'car': 'https://img.icons8.com/color/96/car--v1.png',
    'house': 'https://img.icons8.com/color/96/house.png',
    'sun': 'https://img.icons8.com/color/96/sun--v1.png',
    'water': 'https://img.icons8.com/color/96/water.png',
    'music': 'https://img.icons8.com/color/96/musical-notes.png',
    'time': 'https://img.icons8.com/color/96/clock.png',
    'money': 'https://img.icons8.com/color/96/money-bag.png',
    'tree': 'https://img.icons8.com/color/96/tree.png',
    'world': 'https://img.icons8.com/color/96/globe--v1.png'
};

let gameWordsSource = (typeof comprehensiveWordList !== 'undefined') ? comprehensiveWordList : [
    { word: 'apple', meaning: 'elma' },
    { word: 'book', meaning: 'kitap' },
    { word: 'computer', meaning: 'bilgisayar' },
    { word: 'house', meaning: 'ev' },
    { word: 'sun', meaning: 'güneş' }
];

let roundWords = [];
let matchedCount = 0;
let totalScore = 0;
let selectedWordEl = null; // Tıklayarak eşleştirme desteği için

document.addEventListener("DOMContentLoaded", initGame);

function initGame() {
    const draggablesContainer = document.getElementById("words-source");
    const dropzonesContainer = document.getElementById("drop-target");
    const matchedCountEl = document.getElementById("matched-count");
    const totalRoundCountEl = document.getElementById("total-round-count");

    if (!draggablesContainer || !dropzonesContainer) return;

    draggablesContainer.innerHTML = '';
    dropzonesContainer.innerHTML = '';
    matchedCount = 0;
    selectedWordEl = null;
    if (matchedCountEl) matchedCountEl.textContent = '0';

    // Havuz oluştur
    const richWords = gameWordsSource.filter(w => wordImages[w.word.toLowerCase()]);
    const otherWords = gameWordsSource.filter(w => !wordImages[w.word.toLowerCase()]);
    let pool = [...richWords, ...otherWords];

    // 5 adet kelime seç
    const ROUND_SIZE = 5;
    roundWords = [];
    for (let i = 0; i < ROUND_SIZE; i++) {
        if (pool.length === 0) break;
        const randomIndex = Math.floor(Math.random() * pool.length);
        roundWords.push(pool[randomIndex]);
        pool.splice(randomIndex, 1);
    }

    if (totalRoundCountEl) totalRoundCountEl.textContent = roundWords.length;

    // İngilizce Kelimeler (Sürükleme ve Tıklama)
    const shuffledForDrag = [...roundWords].sort(() => Math.random() - 0.5);
    shuffledForDrag.forEach(item => {
        const dragEl = document.createElement("div");
        dragEl.classList.add("draggable-word");
        dragEl.draggable = true;
        dragEl.textContent = item.word;
        dragEl.id = "word-" + item.word.replace(/\s+/g, "_");
        dragEl.setAttribute("data-word", item.word);

        // Tıklama ile eşleştirme desteği
        dragEl.addEventListener("click", () => {
            if (dragEl.classList.contains("matched")) return;
            if (selectedWordEl) {
                selectedWordEl.classList.remove("selected");
            }
            if (selectedWordEl === dragEl) {
                selectedWordEl = null;
            } else {
                selectedWordEl = dragEl;
                dragEl.classList.add("selected");
            }
        });

        // Drag & Drop desteği
        dragEl.addEventListener("dragstart", dragStart);
        draggablesContainer.appendChild(dragEl);
    });

    // Hedef Alanlar (Türkçe Karşılıklar)
    const shuffledForDrop = [...roundWords].sort(() => Math.random() - 0.5);
    shuffledForDrop.forEach(item => {
        const dropEl = document.createElement("div");
        dropEl.classList.add("drop-zone");
        dropEl.setAttribute("data-match", item.word);
        dropEl.setAttribute("data-meaning", item.meaning);

        // İkon veya soru işareti
        const imgPath = wordImages[item.word.toLowerCase()] || 'https://img.icons8.com/color/96/translation.png';
        const img = document.createElement("img");
        img.src = imgPath;
        img.alt = item.meaning;
        dropEl.appendChild(img);

        // Anlam metni
        const span = document.createElement("span");
        span.classList.add("meaning-text");
        span.textContent = item.meaning;
        dropEl.appendChild(span);

        // Tıklama ile eşleştirme
        dropEl.addEventListener("click", () => {
            if (dropEl.classList.contains("matched")) return;
            if (selectedWordEl) {
                const wordValue = selectedWordEl.getAttribute("data-word");
                executeMatch(selectedWordEl, dropEl, wordValue);
            }
        });

        // Sürükle bırak olayları
        dropEl.addEventListener("dragover", dragOver);
        dropEl.addEventListener("dragleave", dragLeave);
        dropEl.addEventListener("drop", drop);
        dropzonesContainer.appendChild(dropEl);
    });
}

function dragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.getAttribute("data-word"));
    e.dataTransfer.setData("elementId", e.target.id);
}

function dragOver(e) {
    e.preventDefault();
    if (!e.target.closest(".drop-zone").classList.contains("matched")) {
        e.target.closest(".drop-zone").classList.add("drag-over");
    }
}

function dragLeave(e) {
    const zone = e.target.closest(".drop-zone");
    if (zone) zone.classList.remove("drag-over");
}

function drop(e) {
    e.preventDefault();
    const zone = e.target.closest(".drop-zone");
    if (!zone) return;
    zone.classList.remove("drag-over");

    const draggedWord = e.dataTransfer.getData("text/plain");
    const draggedElementId = e.dataTransfer.getData("elementId");
    const draggedElement = document.getElementById(draggedElementId);

    if (draggedElement) {
        executeMatch(draggedElement, zone, draggedWord);
    }
}

function executeMatch(sourceElement, targetZone, word) {
    if (!sourceElement || !targetZone) return;
    const targetMatch = targetZone.getAttribute("data-match");
    const meaning = targetZone.getAttribute("data-meaning");

    if (word === targetMatch) {
        // Başarılı eşleşme
        targetZone.classList.add("matched");
        targetZone.innerHTML = `
            <div style="font-size:1.8rem; margin-bottom:4px;">✨</div>
            <strong style="font-size:1.05rem; display:block;">${word}</strong>
            <span style="font-size:0.85rem; opacity:0.9;">= ${meaning}</span>
        `;

        sourceElement.remove();
        selectedWordEl = null;

        matchedCount++;
        totalScore += 10;
        const matchedCountEl = document.getElementById("matched-count");
        const scoreEl = document.getElementById("user-score");
        if (matchedCountEl) matchedCountEl.textContent = matchedCount;
        if (scoreEl) scoreEl.textContent = totalScore;

        if (matchedCount === roundWords.length) {
            setTimeout(() => {
                alert(`Tebrikler! Tüm kelimeleri başarıyla eşleştirdiniz. Toplam Puan: ${totalScore}`);
                initGame();
            }, 500);
        }
    } else {
        // Yanlış eşleşme efekti
        targetZone.style.borderColor = "#ff4d4d";
        targetZone.style.background = "rgba(255, 77, 77, 0.25)";
        if (sourceElement.classList.contains("selected")) {
            sourceElement.classList.remove("selected");
            selectedWordEl = null;
        }
        setTimeout(() => {
            if (!targetZone.classList.contains("matched")) {
                targetZone.style.borderColor = "";
                targetZone.style.background = "";
            }
        }, 600);
    }
}
