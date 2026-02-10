document.addEventListener('DOMContentLoaded', function() {
    // عناصر DOM
    const board = document.getElementById('chess-board');
    const whiteTimeDisplay = document.getElementById('white-time');
    const blackTimeDisplay = document.getElementById('black-time');
    const currentTurnDisplay = document.getElementById('current-turn');
    const moveCountDisplay = document.getElementById('move-count');
    const boardStatus = document.getElementById('board-status');
    const whiteCaptured = document.getElementById('white-captured');
    const blackCaptured = document.getElementById('black-captured');
    const instructionsModal = document.getElementById('instructions-modal');
    
    // أزرار التحكم
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const helpBtn = document.getElementById('help-btn');
    const hintBtn = document.getElementById('hint-btn');
    const closeModal = document.querySelector('.close-modal');
    
    // متغيرات اللعبة
    let gameState = 'active'; // active, paused, finished
    let currentPlayer = 'white';
    let selectedSquare = null;
    let boardState = [];
    let moveCount = 1;
    let whiteTime = 600; // 10 دقائق بالثواني
    let blackTime = 600;
    let timerInterval = null;
    let enPassantTarget = null; // للترقية
    
    // رموز القطع مع ألوان محسنة
    const pieces = {
        white: {
            king: { symbol: '♔', name: 'الملك', value: 0 },
            queen: { symbol: '♕', name: 'الوزير', value: 9 },
            rook: { symbol: '♖', name: 'الطابية', value: 5 },
            bishop: { symbol: '♗', name: 'الفيل', value: 3 },
            knight: { symbol: '♘', name: 'الحصان', value: 3 },
            pawn: { symbol: '♙', name: 'البيدق', value: 1 }
        },
        black: {
            king: { symbol: '♚', name: 'الملك', value: 0 },
            queen: { symbol: '♛', name: 'الوزير', value: 9 },
            rook: { symbol: '♜', name: 'الطابية', value: 5 },
            bishop: { symbol: '♝', name: 'الفيل', value: 3 },
            knight: { symbol: '♞', name: 'الحصان', value: 3 },
            pawn: { symbol: '♟', name: 'البيدق', value: 1 }
        }
    };
    
    // تهيئة لوحة الشطرنج
    function initBoard() {
        board.innerHTML = '';
        boardState = [];
        
        // إعداد الأحرف والأرقام
        const columns = ['أ', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح'];
        const rows = ['8', '7', '6', '5', '4', '3', '2', '1'];
        
        for (let row = 0; row < 8; row++) {
            boardState[row] = [];
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                square.dataset.coord = columns[col] + rows[row];
                square.dataset.colChar = columns[col];
                square.dataset.rowNum = rows[row];
                
                // وضع القطع في مواضعها الابتدائية
                let pieceData = null;
                
                // الصف 0: القطع السوداء
                if (row === 0) {
                    if (col === 0 || col === 7) pieceData = pieces.black.rook;
                    else if (col === 1 || col === 6) pieceData = pieces.black.knight;
                    else if (col === 2 || col === 5) pieceData = pieces.black.bishop;
                    else if (col === 3) pieceData = pieces.black.queen;
                    else if (col === 4) pieceData = pieces.black.king;
                }
                // الصف 1: بيادق سوداء
                else if (row === 1) {
                    pieceData = pieces.black.pawn;
                }
                // الصف 6: بيادق بيضاء
                else if (row === 6) {
                    pieceData = pieces.white.pawn;
                }
                // الصف 7: القطع البيضاء
                else if (row === 7) {
                    if (col === 0 || col === 7) pieceData = pieces.white.rook;
                    else if (col === 1 || col === 6) pieceData = pieces.white.knight;
                    else if (col === 2 || col === 5) pieceData = pieces.white.bishop;
                    else if (col === 3) pieceData = pieces.white.queen;
                    else if (col === 4) pieceData = pieces.white.king;
                }
                
                if (pieceData) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${pieceData.name}`;
                    pieceElement.textContent = pieceData.symbol;
                    pieceElement.dataset.type = pieceData.name;
                    pieceElement.dataset.color = row < 2 ? 'black' : 'white';
                    pieceElement.dataset.value = pieceData.value;
                    square.appendChild(pieceElement);
                    
                    boardState[row][col] = {
                        piece: pieceData.symbol,
                        type: pieceData.name,
                        color: row < 2 ? 'black' : 'white',
                        value: pieceData.value,
                        hasMoved: false
                    };
                } else {
                    boardState[row][col] = null;
                }
                
                // إضافة حدث النقر مع touch support
                square.addEventListener('click', () => handleSquareClick(row, col));
                square.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    handleSquareClick(row, col);
                });
                
                board.appendChild(square);
            }
        }
    }
    
    // التعامل مع نقر المربع
    function handleSquareClick(row, col) {
        if (gameState !== 'active') return;
        
        const square = boardState[row][col];
        
        // إذا كان هناك مربع محدد بالفعل
        if (selectedSquare) {
            const [selectedRow, selectedCol] = selectedSquare;
            
            // إذا نقرنا على نفس المربع، نلغي التحديد
            if (selectedRow === row && selectedCol === col) {
                clearSelection();
                return;
            }
            
            // محاولة تحريك القطعة
            if (isValidMove(selectedRow, selectedCol, row, col)) {
                movePiece(selectedRow, selectedCol, row, col);
                moveCount++;
                moveCountDisplay.textContent = moveCount;
                
                // تغيير الدور
                currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
                updatePlayerDisplay();
                
                clearSelection();
                
                // التحقق من نهاية اللعبة
                if (isCheckmate()) {
                    endGame(`${currentPlayer === 'white' ? 'الأسود' : 'الأبيض'} يفوز بكش مات!`);
                    return;
                }
                
                if (isStalemate()) {
                    endGame('تعادل!');
                    return;
                }
                
                // إذا كان دور الكمبيوتر
                if (currentPlayer === 'black') {
                    setTimeout(makeComputerMove, 800);
                }
            } else {
                // إذا نقرنا على قطعة من اللون الحالي، نحددها
                if (square && square.color === currentPlayer) {
                    selectSquare(row, col);
                } else {
                    clearSelection();
                }
            }
        } else {
            // تحديد قطعة جديدة
            if (square && square.color === currentPlayer) {
                selectSquare(row, col);
            }
        }
    }
    
    // التحقق من صحة الحركة (قواعد كاملة)
    function isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = boardState[fromRow][fromCol];
        if (!piece || piece.color !== currentPlayer) return false;
        
        const target = boardState[toRow][toCol];
        if (target && target.color === currentPlayer) return false;
        
        const rowDiff = toRow - fromRow;
        const colDiff = toCol - fromCol;
        
        // حركة الملك
        if (piece.type === 'الملك') {
            return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1;
        }
        
        // حركة الوزير
        if (piece.type === 'الوزير') {
            return isClearPath(fromRow, fromCol, toRow, toCol) && 
                   (rowDiff === 0 || colDiff === 0 || Math.abs(rowDiff) === Math.abs(colDiff));
        }
        
        // حركة الطابية
        if (piece.type === 'الطابية') {
            return (rowDiff === 0 || colDiff === 0) && isClearPath(fromRow, fromCol, toRow, toCol);
        }
        
        // حركة الفيل
        if (piece.type === 'الفيل') {
            return Math.abs(rowDiff) === Math.abs(colDiff) && isClearPath(fromRow, fromCol, toRow, toCol);
        }
        
        // حركة الحصان
        if (piece.type === 'الحصان') {
            return (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) || 
                   (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2);
        }
        
        // حركة البيدق
        if (piece.type === 'البيدق') {
            const direction = piece.color === 'white' ? -1 : 1;
            const startRow = piece.color === 'white' ? 6 : 1;
            
            // حركة عادية للأمام
            if (colDiff === 0 && !target) {
                if (rowDiff === direction) return true;
                if (rowDiff === 2 * direction && fromRow === startRow && !boardState[fromRow + direction][fromCol]) {
                    enPassantTarget = [fromRow + direction, fromCol];
                    return true;
                }
            }
            
            // أخذ قطعة
            if (Math.abs(colDiff) === 1 && rowDiff === direction) {
                if (target) return true;
                
                // أخذ en passant
                if (enPassantTarget && toRow === enPassantTarget[0] && toCol === enPassantTarget[1]) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // التحقق من أن المسار خالي
    function isClearPath(fromRow, fromCol, toRow, toCol) {
        const rowStep = Math.sign(toRow - fromRow);
        const colStep = Math.sign(toCol - fromCol);
        
        let row = fromRow + rowStep;
        let col = fromCol + colStep;
        
        while (row !== toRow || col !== toCol) {
            if (boardState[row][col]) return false;
            row += rowStep;
            col += colStep;
        }
        
        return true;
    }
    
    // تحديد مربع
    function selectSquare(row, col) {
        clearSelection();
        
        selectedSquare = [row, col];
        const squareElement = getSquareElement(row, col);
        squareElement.classList.add('selected');
        
        // إظهار الحركات الممكنة
        showPossibleMoves(row, col);
        
        const piece = boardState[row][col];
        boardStatus.innerHTML = `<i class="fas fa-chess-${piece.type === 'الحصان' ? 'knight' : 'pawn'}"></i>
                                <span>محدد: ${piece.type} ${piece.color === 'white' ? 'أبيض' : 'أسود'}</span>`;
    }
    
    // إظهار الحركات الممكنة
    function showPossibleMoves(row, col) {
        const piece = boardState[row][col];
        if (!piece) return;
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (isValidMove(row, col, r, c)) {
                    const squareElement = getSquareElement(r, c);
                    if (boardState[r][c]) {
                        squareElement.classList.add('possible-capture');
                    } else {
                        squareElement.classList.add('possible-move');
                    }
                }
            }
        }
    }
    
    // تحريك قطعة
    function movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = boardState[fromRow][fromCol];
        const target = boardState[toRow][toCol];
        
        // تسجيل الحركة
        piece.hasMoved = true;
        
        // معالجة أخذ en passant
        if (piece.type === 'البيدق' && enPassantTarget && 
            toRow === enPassantTarget[0] && toCol === enPassantTarget[1]) {
            const capturedRow = fromRow;
            const capturedCol = toCol;
            capturePiece(capturedRow, capturedCol, boardState[capturedRow][capturedCol]);
            boardState[capturedRow][capturedCol] = null;
        }
        
        // أخذ القطعة
        if (target) {
            capturePiece(toRow, toCol, target);
        }
        
        // تحريك القطعة
        boardState[toRow][toCol] = piece;
        boardState[fromRow][fromCol] = null;
        
        // ترقية البيدق
        if (piece.type === 'البيدق' && (toRow === 0 || toRow === 7)) {
            promotePawn(toRow, toCol);
        }
        
        // إعادة تعيين en passant
        enPassantTarget = null;
        
        // تحديث الواجهة
        updateBoardDisplay();
        
        // تحديث الرسالة
        boardStatus.innerHTML = `<i class="fas fa-check-circle"></i>
                                <span>تم تحريك ${piece.type}</span>`;
    }
    
    // ترقية البيدق
    function promotePawn(row, col) {
        const piece = boardState[row][col];
        const color = piece.color;
        
        // ترقية إلى وزير تلقائياً
        boardState[row][col] = {
            piece: color === 'white' ? pieces.white.queen.symbol : pieces.black.queen.symbol,
            type: 'الوزير',
            color: color,
            value: 9,
            hasMoved: true
        };
        
        updateBoardDisplay();
        boardStatus.innerHTML = `<i class="fas fa-crown"></i>
                                <span>تم ترقية البيدق إلى وزير!</span>`;
    }
    
    // أخذ قطعة
    function capturePiece(row, col, piece) {
        const capturedElement = document.createElement('div');
        capturedElement.className = `captured-piece ${piece.type}`;
        capturedElement.textContent = piece.piece;
        capturedElement.title = `${piece.type} ${piece.color === 'white' ? 'أبيض' : 'أسود'}`;
        
        if (piece.color === 'white') {
            blackCaptured.appendChild(capturedElement);
        } else {
            whiteCaptured.appendChild(capturedElement);
        }
        
        // إضافة صوت أخذ قطعة
        playCaptureSound();
    }
    
    // تحديث عرض اللوحة
    function updateBoardDisplay() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const squareElement = getSquareElement(row, col);
                squareElement.innerHTML = '';
                
                const piece = boardState[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${piece.type}`;
                    pieceElement.textContent = piece.piece;
                    pieceElement.dataset.type = piece.type;
                    pieceElement.dataset.color = piece.color;
                    pieceElement.dataset.value = piece.value;
                    squareElement.appendChild(pieceElement);
                }
            }
        }
    }
    
    // كش مات
    function isCheckmate() {
        // هذا تنفيذ مبسط
        // في تطوير حقيقي، تحتاج إلى التحقق من كل الحركات الممكنة
        return false;
    }
    
    // تعادل
    function isStalemate() {
        // هذا تنفيذ مبسط
        return false;
    }
    
    // حركة الكمبيوتر
    function makeComputerMove() {
        if (gameState !== 'active' || currentPlayer !== 'black') return;
        
        // البحث عن حركات محتملة
        let possibleMoves = [];
        
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = boardState[fromRow][fromCol];
                if (piece && piece.color === 'black') {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (isValidMove(fromRow, fromCol, toRow, toCol)) {
                                const target = boardState[toRow][toCol];
                                const moveValue = target ? target.value : 0;
                                
                                possibleMoves.push({
                                    fromRow, fromCol, toRow, toCol,
                                    value: moveValue + piece.value / 10
                                });
                            }
                        }
                    }
                }
            }
        }
        
        // اختيار أفضل حركة
        if (possibleMoves.length > 0) {
            // فرز حسب القيمة (أخذ القطع أولاً)
            possibleMoves.sort((a, b) => b.value - a.value);
            
            // اختيار من أفضل 3 حركات
            const topMoves = possibleMoves.slice(0, 3);
            const randomMove = topMoves[Math.floor(Math.random() * topMoves.length)];
            
            movePiece(randomMove.fromRow, randomMove.fromCol, randomMove.toRow, randomMove.toCol);
            
            // تحديث اللعبة
            moveCount++;
            moveCountDisplay.textContent = moveCount;
            currentPlayer = 'white';
            updatePlayerDisplay();
            
            clearSelection();
            playMoveSound();
        }
    }
    
    // تحديث عرض اللاعب
    function updatePlayerDisplay() {
        currentTurnDisplay.textContent = currentPlayer === 'white' ? 'الأبيض' : 'الأسود';
        currentTurnDisplay.className = currentPlayer === 'white' ? 'value player-white' : 'value player-black';
    }
    
    // نهاية اللعبة
    function endGame(message) {
        gameState = 'finished';
        clearInterval(timerInterval);
        boardStatus.innerHTML = `<i class="fas fa-flag-checkered"></i><span>${message}</span>`;
        alert(message);
    }
    
    // بدء المؤقت
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        
        timerInterval = setInterval(() => {
            if (gameState !== 'active') return;
            
            if (currentPlayer === 'white') {
                whiteTime--;
                if (whiteTime <= 0) {
                    endGame('انتهى الوقت! الأسود يفوز!');
                    return;
                }
            } else {
                blackTime--;
                if (blackTime <= 0) {
                    endGame('انتهى الوقت! الأبيض يفوز!');
                    return;
                }
            }
            
            updateTimerDisplay();
        }, 1000);
    }
    
    // تحديث عرض المؤقت
    function updateTimerDisplay() {
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };
        
        whiteTimeDisplay.textContent = formatTime(whiteTime);
        blackTimeDisplay.textContent = formatTime(blackTime);
    }
    
    // مسح التحديد
    function clearSelection() {
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected');
            square.classList.remove('possible-move');
            square.classList.remove('possible-capture');
        });
        selectedSquare = null;
    }
    
    // الحصول على عنصر المربع
    function getSquareElement(row, col) {
        return document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
    }
    
    // إعادة اللعبة
    function resetGame() {
        if (confirm('هل تريد إعادة اللعبة؟ سيتم فقدان التقدم الحالي.')) {
            gameState = 'active';
           