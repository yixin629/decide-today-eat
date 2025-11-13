import Link from 'next/link'
import RandomMemory from './components/RandomMemory'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12 mt-8">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            💕 zyx和zly的小世界 💕
          </h1>
          <p className="text-xl text-white drop-shadow">属于我们两个人的专属空间</p>
        </header>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile */}
          <Link href="/profile">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
              <div className="text-6xl mb-4 text-center">👤</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">个人资料</h2>
              <p className="text-gray-600 text-center">管理信息和生日提醒</p>
            </div>
          </Link>

          {/* Photo Album */}
          <Link href="/photos">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">📸</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">我们的相册</h2>
              <p className="text-gray-600 text-center">记录每一个美好瞬间</p>
            </div>
          </Link>

          {/* Gomoku Game */}
          <Link href="/gomoku">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">⚫⚪</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">五子棋对战</h2>
              <p className="text-gray-600 text-center">来一场甜蜜的对决吧</p>
            </div>
          </Link>

          {/* Anniversaries */}
          <Link href="/anniversaries">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">💝</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">重要纪念日</h2>
              <p className="text-gray-600 text-center">永远铭记我们的每个特殊日子</p>
            </div>
          </Link>

          {/* Food Decider */}
          <Link href="/food">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">🍱</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">今晚吃什么</h2>
              <p className="text-gray-600 text-center">让我来帮你们做决定</p>
            </div>
          </Link>

          {/* Love Notes */}
          <Link href="/notes">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">💌</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">甜蜜留言板</h2>
              <p className="text-gray-600 text-center">留下想对对方说的话</p>
            </div>
          </Link>

          {/* Wishlist */}
          <Link href="/wishlist">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">✨</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">心愿清单</h2>
              <p className="text-gray-600 text-center">一起完成的愿望</p>
            </div>
          </Link>

          {/* Truth or Dare */}
          <Link href="/truth-or-dare">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">💖</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">真心话大冒险</h2>
              <p className="text-gray-600 text-center">增进了解的趣味游戏</p>
            </div>
          </Link>

          {/* Bucket List */}
          <Link href="/bucket-list">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">💑</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">100件想做的事</h2>
              <p className="text-gray-600 text-center">我们的爱情任务清单</p>
            </div>
          </Link>

          {/* Love Quotes */}
          <Link href="/love-quotes">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">💝</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">情话生成器</h2>
              <p className="text-gray-600 text-center">每天一句甜蜜情话</p>
            </div>
          </Link>

          {/* Couple Quiz */}
          <Link href="/couple-quiz">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">🤔</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">情侣问答</h2>
              <p className="text-gray-600 text-center">测测你们的默契度</p>
            </div>
          </Link>

          {/* Rock Paper Scissors */}
          <Link href="/rock-paper-scissors">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">✊</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">石头剪刀布</h2>
              <p className="text-gray-600 text-center">看谁的运气更好</p>
            </div>
          </Link>

          {/* Memory Game */}
          <Link href="/memory-game">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">🃏</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">记忆翻牌</h2>
              <p className="text-gray-600 text-center">考验记忆力的游戏</p>
            </div>
          </Link>

          {/* Drawing */}
          <Link href="/drawing">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">🎨</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">猜猜我画的</h2>
              <p className="text-gray-600 text-center">发挥你的艺术天赋</p>
            </div>
          </Link>

          {/* Countdown */}
          <Link href="/countdown">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">⏰</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">时光计时器</h2>
              <p className="text-gray-600 text-center">记录我们的每一个重要时刻</p>
            </div>
          </Link>

          {/* Schedule */}
          <Link href="/schedule">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">📅</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">共享日程</h2>
              <p className="text-gray-600 text-center">规划两人的约会计划</p>
            </div>
          </Link>

          {/* Time Capsule */}
          <Link href="/time-capsule">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">🎁</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">时光胶囊</h2>
              <p className="text-gray-600 text-center">写给未来的信</p>
            </div>
          </Link>

          {/* Diary */}
          <Link href="/diary">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">📖</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">恋爱日记</h2>
              <p className="text-gray-600 text-center">记录每天的甜蜜瞬间</p>
            </div>
          </Link>

          {/* Feature Requests */}
          <Link href="/feature-requests">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30">
              <div className="text-6xl mb-4 text-center">💡</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">功能申请箱</h2>
              <p className="text-gray-600 text-center">提出你的想法和建议</p>
            </div>
          </Link>
        </div>

        {/* Random Memory Section */}
        <div className="mt-12">
          <RandomMemory />
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-white drop-shadow">
          <p className="text-lg">❤️ 愿我们的爱情永远甜蜜 ❤️</p>
        </footer>
      </div>
    </main>
  )
}
