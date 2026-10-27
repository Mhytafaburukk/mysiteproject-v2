// Image path map (fallback or hardcoded for specific words if not in DB)
const wordImages = {
    'apple': 'https://img.icons8.com/color/96/apple.png',
    'book': 'https://img.icons8.com/color/96/book.png',
    'computer': 'https://img.icons8.com/color/96/imac.png',
    'sea': '../sea.jpg', // Local example
    'elephant': 'https://img.icons8.com/color/96/elephant.png',
    'cat': 'https://img.icons8.com/color/96/cat.png',
    'dog': 'https://img.icons8.com/color/96/dog.png',
    'car': 'https://img.icons8.com/color/96/car--v1.png',
    'house': 'https://img.icons8.com/color/96/house.png',
    'sun': 'https://img.icons8.com/color/96/sun--v1.png'
};

// Use the comprehensive word list, or fallback
// We filter for words we have images for, or just take first few and give them placeholders
let gameWordsSource = (typeof comprehensiveWordList !== 'undefined') ? comprehensiveWordList : [
    { word: 'apple', meaning: 'elma' },
    { word: 'book', meaning: 'kitap' },
    { word: 'computer', meaning: 'bilgisayar' }
];

let gameWords = [];

let roundWords = [];

// Initialize game on load
document.addEventListener("DOMContentLoaded", initGame);

function initGame() {
    const draggablesContainer = document.getElementById("words-source"); // Updated ID
    const dropzonesContainer = document.getElementById("drop-target");   // Updated ID

    if (!draggablesContainer || !dropzonesContainer) return;

    draggablesContainer.innerHTML = '';
    dropzonesContainer.innerHTML = '';

    // Prepare Game Words (Map images if available)
    // We try to find words from source that match our image list first for better UX
    const richWords = gameWordsSource.filter(w => wordImages[w.word.toLowerCase()]);
    const otherWords = gameWordsSource.filter(w => !wordImages[w.word.toLowerCase()]);

    // Combine: Prioritize words with images, then take random others
    let pool = [...richWords, ...otherWords];

    // Pick 5 random words
    roundWords = [];
    for (let i = 0; i < 5; i++) {
        if (pool.length === 0) break;
        const randomIndex = Math.floor(Math.random() * pool.length);
        roundWords.push(pool[randomIndex]);
        pool.splice(randomIndex, 1);
    }

    // Create Draggable Items (English Words)
    const shuffledForDrag = [...roundWords].sort(() => Math.random() - 0.5);
    shuffledForDrag.forEach(item => {
        const dragEl = document.createElement("div");
        dragEl.classList.add("draggable-word"); // Use new class
        dragEl.draggable = true;

        // Word + Audio Icon
        dragEl.innerHTML = `<span>${item.word}</span> <span class="audio-icon" style="margin-left:8px; cursor:pointer;">🔊</span>`;

        dragEl.id = "word-" + item.word;
        dragEl.setAttribute("data-word", item.word);

        // Add Audio Icon/Click
        // Play audio when clicking the icon or the specific word (optional)
        dragEl.querySelector(".audio-icon").addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent bubbling if needed
            speak(item.word);
        });

        // Also allow clicking the whole card for convenience? 
        // The user specifically asked for "listening part", icon makes it clear.
        // We'll keep the whole card click too, but the icon is the visual cue.
        dragEl.addEventListener("click", () => speak(item.word));

        dragEl.addEventListener("dragstart", dragStart);
        draggablesContainer.appendChild(dragEl);
    });

    // Create Drop Zones (Images + Meanings)
    const shuffledForDrop = [...roundWords].sort(() => Math.random() - 0.5);
    shuffledForDrop.forEach(item => {
        const dropEl = document.createElement("div");
        dropEl.classList.add("drop-zone");
        dropEl.setAttribute("data-match", item.word);

        // Image
        const imgPath = wordImages[item.word.toLowerCase()] || 'https://img.icons8.com/color/96/question-mark.png';
        const img = document.createElement("img");
        img.src = imgPath;
        dropEl.appendChild(img);

        // Meaning Text
        const span = document.createElement("span");
        span.textContent = item.meaning;
        dropEl.appendChild(span);

        dropEl.addEventListener("dragover", dragOver);
        dropEl.addEventListener("dragleave", dragLeave);
        dropEl.addEventListener("drop", drop);
        dropzonesContainer.appendChild(dropEl);
    });
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}

function dragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.getAttribute("data-word"));
    e.dataTransfer.setData("elementId", e.target.id);
}

function dragOver(e) {
    e.preventDefault();
    if (!e.target.classList.contains("matched")) {
        e.target.classList.add("drag-over");
    }
}

function dragLeave(e) {
    e.target.classList.remove("drag-over");
}

function drop(e) {
    e.preventDefault();
    e.target.classList.remove("drag-over");

    const draggedWord = e.dataTransfer.getData("text/plain");
    const draggedElementId = e.dataTransfer.getData("elementId");
    const targetMatch = e.target.getAttribute("data-match");

    if (draggedWord === targetMatch) {
        // Correct Match
        e.target.classList.add("matched");
        e.target.style.backgroundColor = "#4caf50";
        e.target.style.color = "white";
        e.target.textContent = `${draggedWord} = ${e.target.textContent}`; // Show pair

        // Remove the dragged item
        const draggedElement = document.getElementById(draggedElementId);
        if (draggedElement) {
            draggedElement.remove();
        }

        checkWin();
    } else {
        // Incorrect
        e.target.classList.add("shake");
        setTimeout(() => e.target.classList.remove("shake"), 500);

        // Audio Feedback for wrong?
    }
}

function checkWin() {
    const remainingDraggables = document.querySelectorAll(".draggable");
    if (remainingDraggables.length === 0) {
        // Show Win Modal
        const modal = document.getElementById("resultModal");
        modal.style.display = "flex";

        // Save score logic if needed (optional)
    }
}
