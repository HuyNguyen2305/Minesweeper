# Các cấu trúc dữ liệu được sử dụng trong Minesweeper

## 1. Mảng hai chiều (2D Array) cho bàn cờ
- **board**:  
  Đây là một mảng hai chiều, mỗi phần tử là một object đại diện cho một ô trên bàn cờ.
  ```js
  board = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      revealed: false,
      adjacentMines: 0,
      flagged: false
    }))
  );
  ```
  - `isMine`: boolean, xác định ô có phải là mìn không.
  - `revealed`: boolean, ô đã được mở chưa.
  - `adjacentMines`: số lượng mìn xung quanh ô.
  - `flagged`: boolean, ô đã được cắm cờ chưa.

## 2. Stack (Mảng) cho chức năng hoàn tác (Undo)
- **boardHistory**:  
  Là một mảng lưu lại các trạng thái trước đó của bàn cờ, dùng để hoàn tác.
  ```js
  boardHistory = [
    {
      board: [...], // bản sao sâu của board
      gameOver: ...,
      firstMove: ...,
      seconds: ...
    },
    ...
  ]
  ```
  Khi người chơi thực hiện một hành động, trạng thái hiện tại sẽ được lưu vào stack này.

## 3. Queue (Hàng đợi) cho flood fill (mở ô trống liên tiếp)
- **queue**:  
  Được sử dụng trong hàm `floodReveal` để mở các ô trống liên tiếp bằng thuật toán BFS.
  ```js
  const queue = [[r, c]];
  while (queue.length > 0) {
    const [cr, cc] = queue.shift();
    // ... kiểm tra và thêm các ô lân cận vào queue ...
  }
  ```

## 4. Mảng visited (đã thăm) cho flood fill
- **visited**:  
  Mảng hai chiều boolean để đánh dấu các ô đã được kiểm tra trong quá trình flood fill.
  ```js
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  ```

## 5. Các biến trạng thái đơn giản
- **gameOver, firstMove, timer, seconds**:  
  Các biến này là kiểu boolean hoặc số, dùng để lưu trạng thái tổng thể của trò chơi.

---

**Tóm lại:**  
- Bàn cờ: mảng 2 chiều các object.
- Lịch sử undo: mảng (stack) các trạng thái.
- Flood fill: queue (mảng) và mảng visited.
- Các biến trạng thái: biến đơn giản.
