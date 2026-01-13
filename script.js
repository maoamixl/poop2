// 应用初始化
class PoopTracker {
    constructor() {
        this.userId = this.generateOrGetUserId();
        this.records = this.getRecords();
        this.friends = this.getFriends();
        this.init();
    }

    // 生成或获取用户ID
    generateOrGetUserId() {
        let userId = localStorage.getItem('poopUserId');
        if (!userId) {
            userId = 'POOP_' + Math.random().toString(36).substr(2, 9).toUpperCase();
            localStorage.setItem('poopUserId', userId);
        }
        return userId;
    }

    // 初始化应用
    init() {
        this.displayUserId();
        this.setShareLink();
        this.setDefaultTime();
        this.bindEvents();
        this.updateStats();
        this.renderHistory();
        this.renderFriends();
    }

    // 设置分享链接
    setShareLink() {
        const shareLink = this.generateShareLink();
        document.getElementById('shareLink').value = shareLink;
    }

    // 显示用户ID
    displayUserId() {
        document.getElementById('userId').textContent = this.userId;
    }

    // 设置默认时间为当前时间
    setDefaultTime() {
        const now = new Date();
        const timeString = now.toTimeString().slice(0, 5);
        document.getElementById('time').value = timeString;
    }

    // 绑定事件
    bindEvents() {
        // 表单提交事件
        document.getElementById('recordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.recordPoop();
        });
    }

    // 记录拉屎数据
    recordPoop() {
        const form = document.getElementById('recordForm');
        const time = form.time.value;
        const smoothness = form.smoothness.value;

        const record = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            time: time,
            smoothness: smoothness,
            timestamp: Date.now()
        };

        this.records.push(record);
        this.saveRecords();
        this.updateStats();
        this.renderHistory();
        this.showNotification('记录成功！💩');

        // 重置表单
        form.reset();
        this.setDefaultTime();
    }

    // 获取记录数据
    getRecords() {
        const records = localStorage.getItem('poopRecords');
        return records ? JSON.parse(records) : [];
    }

    // 保存记录数据
    saveRecords() {
        localStorage.setItem('poopRecords', JSON.stringify(this.records));
    }

    // 获取好友数据
    getFriends() {
        const friends = localStorage.getItem('poopFriends');
        return friends ? JSON.parse(friends) : [];
    }

    // 添加好友
    addFriend() {
        const friendId = document.getElementById('friendId').value.trim();
        const friendName = document.getElementById('friendName').value.trim();

        if (!friendId || !friendName) {
            this.showNotification('请输入好友ID和昵称！');
            return;
        }

        if (friendId === this.userId) {
            this.showNotification('不能添加自己为好友！');
            return;
        }

        if (this.friends.some(friend => friend.id === friendId)) {
            this.showNotification('该好友已添加！');
            return;
        }

        const newFriend = {
            id: friendId,
            name: friendName,
            likes: 0
        };

        this.friends.push(newFriend);
        this.saveFriends();
        this.renderFriends();
        this.showNotification('好友添加成功！');

        // 清空输入框
        document.getElementById('friendId').value = '';
        document.getElementById('friendName').value = '';
    }

    // 生成分享链接
    generateShareLink() {
        const baseUrl = window.location.href.split('?')[0];
        return `${baseUrl}?userId=${this.userId}`;
    }

    // 复制分享链接
    copyShareLink() {
        const shareLink = this.generateShareLink();
        navigator.clipboard.writeText(shareLink).then(() => {
            this.showNotification('链接复制成功！快去分享给好友吧！');
        }).catch(() => {
            //  fallback for browsers that don't support clipboard API
            const shareInput = document.getElementById('shareLink');
            shareInput.select();
            document.execCommand('copy');
            this.showNotification('链接复制成功！快去分享给好友吧！');
        });
    }

    // 更新统计数据
    updateStats() {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // 今日次数
        const todayCount = this.records.filter(record => record.date === today).length;
        document.getElementById('todayCount').textContent = todayCount;

        // 本周次数
        const weekCount = this.records.filter(record => record.date >= weekAgo).length;
        document.getElementById('weekCount').textContent = weekCount;

        // 本月次数
        const monthCount = this.records.filter(record => record.date >= monthAgo).length;
        document.getElementById('monthCount').textContent = monthCount;

        // 平均通畅度
        if (this.records.length > 0) {
            const smoothnessScores = {
                'very_smooth': 5,
                'smooth': 4,
                'normal': 3,
                'difficult': 2,
                'very_difficult': 1
            };
            const totalScore = this.records.reduce((sum, record) => sum + smoothnessScores[record.smoothness], 0);
            const avgScore = totalScore / this.records.length;
            const avgSmoothness = this.getSmoothnessText(Math.round(avgScore));
            document.getElementById('avgSmoothness').textContent = avgSmoothness;
        } else {
            document.getElementById('avgSmoothness').textContent = '--';
        }
    }

    // 获取通畅度文本
    getSmoothnessText(score) {
        const smoothnessMap = {
            5: '非常通畅',
            4: '通畅',
            3: '正常',
            2: '困难',
            1: '非常困难'
        };
        return smoothnessMap[score] || '--';
    }

    // 渲染历史记录
    renderHistory() {
        const historyList = document.getElementById('historyList');
        const recentRecords = this.records.slice(-10).reverse();

        if (recentRecords.length === 0) {
            historyList.innerHTML = '<div class="empty-state">还没有记录，快去拉屎吧！💩</div>';
            return;
        }

        historyList.innerHTML = recentRecords.map(record => `
            <div class="history-item">
                <div class="details">
                    <div class="time">${record.date} ${record.time}</div>
                    <div class="smoothness">
                        <span class="smoothness-badge smoothness-${record.smoothness}">
                            ${this.getSmoothnessText(this.getSmoothnessScore(record.smoothness))}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 获取通畅度分数
    getSmoothnessScore(smoothness) {
        const scores = {
            'very_smooth': 5,
            'smooth': 4,
            'normal': 3,
            'difficult': 2,
            'very_difficult': 1
        };
        return scores[smoothness] || 3;
    }

    // 渲染好友列表
    renderFriends() {
        const friendsGrid = document.getElementById('friendsGrid');
        
        if (this.friends.length === 0) {
            friendsGrid.innerHTML = '<div class="empty-state">还没有添加好友，快去分享链接给好友吧！</div>';
            return;
        }
        
        friendsGrid.innerHTML = this.friends.map(friend => `
            <div class="friend-card">
                <h4>${friend.name}</h4>
                <p>好友ID：${friend.id}</p>
                <div class="likes-count">
                    <span>❤️</span>
                    <span id="likes-${friend.id}">${friend.likes}</span>
                </div>
                <button class="btn btn-like" onclick="poopTracker.likeFriend('${friend.id}')">
                    点赞鼓励
                </button>
            </div>
        `).join('');
    }

    // 点赞好友
    likeFriend(friendId) {
        const friend = this.friends.find(f => f.id === friendId);
        if (friend) {
            friend.likes++;
            this.saveFriends();
            this.renderFriends();
            this.showNotification('点赞成功！❤️');
        }
    }

    // 保存好友数据
    saveFriends() {
        localStorage.setItem('poopFriends', JSON.stringify(this.friends));
    }

    // 显示通知
    showNotification(message) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #667eea;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            font-weight: bold;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        // 添加到页面
        document.body.appendChild(notification);

        // 3秒后移除
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    }
}

// 初始化应用
const poopTracker = new PoopTracker();
