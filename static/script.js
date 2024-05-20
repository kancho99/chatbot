let lastMessageTime = null; // 이전 메시지의 시간을 저장할 변수 시간 기록 기능 추가

function displayTimeLabel(currentTime) {
    const timeLabel = document.createElement("div");
    timeLabel.classList.add("time-label");
    const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
    });
    timeLabel.textContent = dateFormatter.format(currentTime);
    const chatWindow = document.getElementById("chat-window");
    chatWindow.appendChild(timeLabel);
}

function logout() {
    window.location.href = "/logout";
}


function showTypingIndicator() {
    const typingIndicator = document.createElement("div");
    typingIndicator.classList.add("typing-indicator");
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement("div");
        dot.classList.add("typing-dot");
        typingIndicator.appendChild(dot);
    }
    const chatWindow = document.getElementById("chat-window");
    chatWindow.appendChild(typingIndicator);
    scrollToBottom();
    return typingIndicator;
}


function scrollToBottom() {
    const chatWindow = document.getElementById("chat-window");
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

document.getElementById("user-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); // Prevent default Enter key behavior
        sendMessage();
    }
});

function sendMessage() {
    const currentTime = new Date(); // 시간 기록.
    const userInput = document.getElementById("user-input");
    const chatWindow = document.getElementById("chat-window");
    const message = userInput.value;
    userInput.value = ''; // 입력란을 비웁니다

      // 이전 메시지 시간과 비교하여 시간 레이블 표시
    if (!lastMessageTime || (currentTime - lastMessageTime) > 1800000) { // 30분 후 시간이 레이블이 표시됩니다
        displayTimeLabel(currentTime);
    }
    
    lastMessageTime = currentTime; // 시간 업데이트

    /*
    
    const userMessageProfile = document.createElement("div");
    userMessageProfile.classList.add("user-profile")
    userMessageProfile.textContent = "현권님";
     // 프로필 이미지를 위한 img 요소 생성
    const profileImage = document.createElement("img");
    // 이미지 소스 설정, CSS 클래스 추가
    profileImage.src = "/static/a.jpeg";
    profileImage.classList.add("user-profile-image"); 
    // userMessageProfile div에 프로필 이미지 추가
    userMessageProfile.appendChild(profileImage);
    // chatWindow에 userMessageProfile div 추가
    chatWindow.appendChild(userMessageProfile); 

    */


    // Display the user's message in the chat window
    const userMessageElement = document.createElement("div");
    userMessageElement.textContent = message;
    userMessageElement.classList.add("user-message");
  
    chatWindow.appendChild(userMessageElement);
    scrollToBottom(); 

    const typingIndicator = showTypingIndicator();

    // Flask의 /chat 엔드포인트로 메시지 전송
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_input: message
        }),
    })
    .then(response => response.json())
    .then(data => {
        // 응답을 받으면 타이핑 인디케이터 제거
        typingIndicator.remove();

        // 봇 메시지를 포함하는 컨테이너 생성
        const botMessageContainer = document.createElement("div");
        botMessageContainer.classList.add("bot-message-container");

        // 프로필 이미지를 생성하고 컨테이너에 추가
        const botProfileImage = document.createElement("img");
        botProfileImage.src = "/static/imgs/ai_friend.png";
        botProfileImage.classList.add("bot-profile-image");
        botMessageContainer.appendChild(botProfileImage);

        // 텍스트 메시지를 생성하고 컨테이너에 추가
        const botMessage = document.createElement("div");
        botMessage.textContent = data.response;
        botMessage.classList.add("bot-message");
        botMessageContainer.appendChild(botMessage);

        // 컨테이너를 채팅 창에 추가
        chatWindow.appendChild(botMessageContainer);
        scrollToBottom();
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

  // 채팅기록 저장
  document.addEventListener("DOMContentLoaded", function() {
    fetch('/history')
        .then(response => response.json())
        .then(data => {
            const chatWindow = document.getElementById("chat-window");
            data.forEach(chat => {
                const messageTime = new Date(chat.timestamp);

                // 이전 메시지 시간과 비교하여 시간 레이블 표시
                if (!lastMessageTime || (messageTime - lastMessageTime) > 1800000) { // 30분 후 시간이 레이블이 표시됩니다
                    displayTimeLabel(messageTime);
                }
                lastMessageTime = messageTime; // 시간 업데이트

                // 사용자 메시지
                const userMessageElement = document.createElement("div");
                userMessageElement.textContent = chat.user_input;
                userMessageElement.classList.add("user-message");
                chatWindow.appendChild(userMessageElement);

                // 챗봇 메시지
                const botMessageContainer = document.createElement("div");
                botMessageContainer.classList.add("bot-message-container");

                const botProfileImage = document.createElement("img");
                botProfileImage.src = "/static/imgs/ai_friend.png";
                botProfileImage.classList.add("bot-profile-image");
                botMessageContainer.appendChild(botProfileImage);

                const botMessage = document.createElement("div");
                botMessage.textContent = chat.chatbot_response;
                botMessage.classList.add("bot-message");
                botMessageContainer.appendChild(botMessage);

                chatWindow.appendChild(botMessageContainer);
            });
            scrollToBottom();
        })
        .catch(error => {
            console.error('Error:', error);
        });
});



// 상단 왼쪽 시간

function updateTime() {
    const timeElement = document.getElementById('current-time');
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeElement.innerText = `${hours}:${minutes}`;
}
function startClock() {
    updateTime(); // 첫 실행 시에 업데이트합니다.
    setInterval(updateTime, 600); // 매 분마다 업데이트합니다.
}

window.onload = startClock;



// 자동 메시지
let inactivityTimeout;
let autoMsgCount = 0;

function resetInactivityTimer() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(sendPeriodicBotMessages, 30000); // 20초 간 메시지 미전송 시 작동
}

function displayBotMessage(message) {
    if (message) {
        const chatWindow = document.getElementById("chat-window");
        const botMessageContainer = document.createElement("div");
        botMessageContainer.classList.add("bot-message-container");

        const botProfileImage = document.createElement("img");
        botProfileImage.src = "/static/imgs/ai_friend.png";
        botProfileImage.classList.add("bot-profile-image");
        botMessageContainer.appendChild(botProfileImage);

        const botMessage = document.createElement("div");
        botMessage.textContent = message;
        botMessage.classList.add("bot-message");
        botMessageContainer.appendChild(botMessage);

        chatWindow.appendChild(botMessageContainer);
        scrollToBottom();
    }
}

function sendInitialBotMessage() {
    fetch('/init-message')
        .then(response => response.json())
        .then(data => {
            displayBotMessage(data.response);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// 자동 메시지 전송 함수
function sendPeriodicBotMessages() {
    if (autoMsgCount < 2) {
        fetch('/periodic-message')
            .then(response => response.json())
            .then(data => {
                if (data.response) {
                    displayBotMessage(data.response);
                    autoMsgCount++;
                }
                resetInactivityTimer(); // 메시지를 보낸 후 타이머를 재설정
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
}

// 초기 메시지를 보냄
document.addEventListener("DOMContentLoaded", function() {
    fetch('/init-message')
        .then(response => response.json())
        .then(data => {
            displayBotMessage(data.response);
        })
        .catch(error => {
            console.error('Error:', error);
        });
});


// 메시지 삭제 확인 메시지 발송

function confirmDeletion() {
    if (confirm('정말 대화 내역을 삭제하시겠습니까?')) {
        fetch('/delete-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}'  // CSRF 토큰을 포함해야 합니다
            }
        }).then(response => {
            if (response.ok) {
                alert('대화 기록이 삭제되었습니다.');
                window.location.reload();  // 페이지를 새로 고침하여 변경사항을 반영
            } else {
                alert('대화 기록을 삭제하는 중 문제가 발생했습니다.');
            }
        });
    }
}


// 토글 네비게이션

function toggleNavBar() {
    const navBar = document.getElementById('nav-bar');
    const navBarBlack = document.getElementById('nav-bar_black');
    navBar.classList.toggle('active');
    navBarBlack.classList.toggle('active');
}

