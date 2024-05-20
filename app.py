from flask import Flask, render_template, redirect, request, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, current_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from openai import OpenAI
from datetime import datetime
import os
from dotenv import load_dotenv




app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'


#환경변수 설정
load_dotenv()
app.config['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=app.config['OPENAI_API_KEY'])

# Database setup
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'


# A simple in-memory structure to store conversation history, keyed by user ID
user_conversations = {}

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(30), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False)

class Chat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user_input = db.Column(db.String(500), nullable=False)
    chatbot_response = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)  # timestamp 필드 추가
    user = db.relationship('User', backref='chats')

@app.route('/history', methods=['GET'])
@login_required
def history():
    user_id = current_user.id
    chats = Chat.query.filter_by(user_id=user_id).all()

    chat_history = []
    for chat in chats:
        chat_history.append({
            "user_input": chat.user_input,
            "chatbot_response": chat.chatbot_response,
            "timestamp": chat.timestamp.isoformat()  # 적절한 타임스탬프 필드 사용
        })

    return jsonify(chat_history)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Login route
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('home'))
        else:
            flash('잘못된 사용자 이름 또는 비밀번호입니다.', 'error')  # Flash error message
            return redirect(url_for('login'))  # Redirect to login page

    return render_template('login.html')

# Register route
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        existing_user = User.query.filter_by(username=username).first()

        if existing_user:
            flash('This username is already taken. Please choose a different one.')
            return redirect(url_for('register'))
        else:
            password = request.form['password']
            hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

            new_user = User(username=username, password=hashed_password)
            db.session.add(new_user)
            db.session.commit()
            
            return redirect(url_for('login'))
    
    return render_template('register.html')

# Logout route
@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

# Home route
@app.route('/')
@login_required
def home():
    user_id = current_user.id
    chats = Chat.query.filter_by(user_id=user_id).all()
    
    conversation_history = []
    for chat in chats:
        conversation_history.append({"role": "user", "content": chat.user_input})
        conversation_history.append({"role": "assistant", "content": chat.chatbot_response})

    user_conversations[user_id] = conversation_history
    
    return render_template('index.html')

@app.route('/calling')
def calling():
    return render_template('calling.html')

# Chatbot route
@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_id = str(current_user.id)
    user_input = data.get('user_input')

    conversation_history = user_conversations.get(user_id, [
        {"role": "system", "content": "You are a qualified mental health counselor...Your responses should be a sentence or two, unless the user’s request requires reasoning or long-form outputs. try to keep up the conversation and make the user talk or answer to you."}
    ])

    response = client.chat.completions.create(
        model="gpt-4o",  # gpt-4o, gpt-4-turbo, or gpt-3.5-turbo
        messages=conversation_history + [{"role": "user", "content": user_input}]
    )
 
    chatbot_response = response.choices[0].message.content

        # 대화 내역을 데이터베이스에 저장
    chat_record = Chat(user_id=user_id, user_input=user_input, chatbot_response=chatbot_response)
    db.session.add(chat_record)
    db.session.commit()

    conversation_history.extend([
        {"role": "user", "content": user_input},
        {"role": "assistant", "content": chatbot_response}
    ])
    user_conversations[user_id] = conversation_history

    return jsonify({"response": chatbot_response})

  # 자동 메시지
# 자동 메시지 카운트 플래그 추가
user_auto_msg_count = {}

@app.route('/init-message', methods=['GET'])
@login_required
def init_message():
    user_id = current_user.id
    user_auto_msg_count[user_id] = 0  # 플래그 초기화
    bot_message = gpt_text_generation()
    return jsonify({"response": bot_message})

@app.route('/periodic-message', methods=['GET'])
@login_required
def periodic_message():
    user_id = current_user.id
    if user_auto_msg_count.get(user_id, 0) < 1:
        bot_message = gpt_text_generation()
        user_auto_msg_count[user_id] = user_auto_msg_count.get(user_id, 0) + 1
        return jsonify({"response": bot_message})
    else:
        return jsonify({"response": ""})  # 메시지 전달하지 않음

def gpt_text_generation():
    messages = [
        {"role": "system", "content": "You are a qualified mental health counselor."},
        {"role": "user", "content": "pretend that you are trying to make me talk. you are texting me. speak korean.make the text as short as possible."}
    ]
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages
    )
    return response.choices[0].message.content

@app.route('/reset-auto-msg-count', methods=['POST'])
@login_required
def reset_auto_msg_count():
    user_id = current_user.id
    user_auto_msg_count[user_id] = 0
    return "", 204  # No content

# 채팅 기록 삭제
@app.route('/delete-history', methods=['POST'])
@login_required
def delete_history():
    user_id = current_user.id
    try:
        Chat.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        flash('대화 기록이 성공적으로 삭제되었습니다.', 'success')
    except Exception as e:
        db.session.rollback()
        flash('대화 기록 삭제 중 오류가 발생했습니다.', 'error')
    return redirect(url_for('home'))




if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)

