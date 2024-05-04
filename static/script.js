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
        botProfileImage.src = "/static/ai_friend.png";
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
                const userMessageElement = document.createElement("div");
                userMessageElement.textContent = chat.user_input;
                userMessageElement.classList.add("user-message");
                chatWindow.appendChild(userMessageElement);

                const botMessageContainer = document.createElement("div");
                botMessageContainer.classList.add("bot-message-container");

                const botProfileImage = document.createElement("img");
                botProfileImage.src = "/static/ai_friend.png";
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


