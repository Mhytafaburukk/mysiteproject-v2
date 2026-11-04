// dinleme_testi.js - Modern & Mobil Uyumlu Kelime Eşleştirme Testi

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
let selectedWordEl = null;

document.addEventListener("DOMContentLoaded", initGame);

function initGame() {
    const wordsContainer = document.getElementById("words-source");
    const targetsContainer = document.getElementById("drop-target");
    const matchedCountEl = document.getElementById("matched-count");
    const totalRoundCountEl = document.getElementById("total-round-count");

    if (!wordsContainer || !targetsContainer) return;

    wordsContainer.innerHTML = '';
    targetsContainer.innerHTML = '';
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

    // İngilizce Kelimeler (word-chip)
    const shuffledForDrag = [...roundWords].sort(() => Math.random() - 0.5);
    shuffledForDrag.forEach(item => {
        const dragEl = document.createElement("div");
        dragEl.classList.add("word-chip");
        dragEl.draggable = true;
        dragEl.textContent = item.word;
        dragEl.id = "word-" + item.word.replace(/\s+/g, "_");
        dragEl.setAttribute("data-word", item.word);

        // Tıklayarak veya Dokunarak Eşleştirme (Mobilde süper kolay)
        dragEl.addEventListener("click", () => {
            if (dragEl.classList.contains("matched")) return;
            if (selectedWordEl && selectedWordEl !== dragEl) {
                selectedWordEl.classList.remove("selected");
            }
            if (selectedWordEl === dragEl) {
                selectedWordEl.classList.remove("selected");
                selectedWordEl = null;
            } else {
                selectedWordEl = dragEl;
                dragEl.classList.add("selected");
            }
        });

        // Masaüstü Drag & Drop
        dragEl.addEventListener("dragstart", dragStart);
        wordsContainer.appendChild(dragEl);
    });

    // Hedef Türkçe Kutuları (target-box)
    const shuffledForDrop = [...roundWords].sort(() => Math.random() - 0.5);
    shuffledForDrop.forEach(item => {
        const dropEl = document.createElement("div");
        dropEl.classList.add("target-box");
        dropEl.setAttribute("data-match", item.word);
        dropEl.setAttribute("data-meaning", item.meaning);

        const imgPath = wordImages[item.word.toLowerCase()] || 'https://img.icons8.com/color/96/translation.png';
        const img = document.createElement("img");
        img.src = imgPath;
        img.alt = item.meaning;
        dropEl.appendChild(img);

        const span = document.createElement("span");
        span.classList.add("meaning-label");
        span.textContent = item.meaning;
        dropEl.appendChild(span);

        // Tıklayarak Eşleştirme Tetikleyicisi
        dropEl.addEventListener("click", () => {
            if (dropEl.classList.contains("matched")) return;
            if (selectedWordEl) {
                const wordValue = selectedWordEl.getAttribute("data-word");
                executeMatch(selectedWordEl, dropEl, wordValue);
            }
        });

        // Sürükle Bırak Olayları
        dropEl.addEventListener("dragover", dragOver);
        dropEl.addEventListener("dragleave", dragLeave);
        dropEl.addEventListener("drop", drop);
        targetsContainer.appendChild(dropEl);
    });
}

function dragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.getAttribute("data-word"));
    e.dataTransfer.setData("elementId", e.target.id);
}

function dragOver(e) {
    e.preventDefault();
    const box = e.target.closest(".target-box");
    if (box && !box.classList.contains("matched")) {
        box.classList.add("drag-over");
    }
}

function dragLeave(e) {
    const box = e.target.closest(".target-box");
    if (box) box.classList.remove("drag-over");
}

function drop(e) {
    e.preventDefault();
    const box = e.target.closest(".target-box");
    if (!box) return;
    box.classList.remove("drag-over");

    const draggedWord = e.dataTransfer.getData("text/plain");
    const draggedElementId = e.dataTransfer.getData("elementId");
    const draggedElement = document.getElementById(draggedElementId);

    if (draggedElement) {
        executeMatch(draggedElement, box, draggedWord);
    }
}

function executeMatch(sourceElement, targetZone, word) {
    if (!sourceElement || !targetZone) return;
    const targetMatch = targetZone.getAttribute("data-match");
    const meaning = targetZone.getAttribute("data-meaning");

    if (word === targetMatch) {
        // Doğru Eşleşme
        targetZone.classList.add("matched");
        targetZone.innerHTML = `
            <div style="font-size:1.6rem; margin-bottom:2px;">✨</div>
            <div class="matched-title">${word}</div>
            <div class="matched-sub">${meaning}</div>
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
                alert(`🎉 Tebrikler! Tüm kelimeleri başarıyla eşleştirdiniz!\nToplam Skor: ${totalScore}`);
                initGame();
            }, 400);
        }
    } else {
        // Yanlış Eşleşme Efekti
        targetZone.style.borderColor = "#ef4444";
        targetZone.style.background = "rgba(239, 68, 68, 0.25)";
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
