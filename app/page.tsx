import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12 mt-8">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            💕 zyx和zly的小世界 💕
          </h1>
          <p className="text-xl text-white drop-shadow">
            属于我们两个人的专属空间
          </p>
        </header>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Photo Album */}
          <Link href="/photos">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">📸</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">
                我们的相册
              </h2>
              <p className="text-gray-600 text-center">
                记录每一个美好瞬间
              </p>
            </div>
          </Link>

          {/* Gomoku Game */}
          <Link href="/gomoku">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">⚫⚪</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">
                五子棋对战
              </h2>
              <p className="text-gray-600 text-center">
                来一场甜蜜的对决吧
              </p>
            </div>
          </Link>

          {/* Anniversaries */}
          <Link href="/anniversaries">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">💝</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">
                重要纪念日
              </h2>
              <p className="text-gray-600 text-center">
                永远铭记我们的每个特殊日子
              </p>
            </div>
          </Link>

          {/* Food Decider */}
          <Link href="/food">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">🍱</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">
                今晚吃什么
              </h2>
              <p className="text-gray-600 text-center">
                让我来帮你们做决定
              </p>
            </div>
          </Link>

          {/* Love Notes */}
          <Link href="/notes">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">💌</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">
                甜蜜留言板
              </h2>
              <p className="text-gray-600 text-center">
                留下想对对方说的话
              </p>
            </div>
          </Link>

          {/* Wishlist */}
          <Link href="/wishlist">
            <div className="card hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
              <div className="text-6xl mb-4 text-center">✨</div>
              <h2 className="text-2xl font-bold text-center mb-2 text-primary">
                心愿清单
              </h2>
              <p className="text-gray-600 text-center">
                一起完成的愿望
              </p>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-white drop-shadow">
          <p className="text-lg">❤️ 愿我们的爱情永远甜蜜 ❤️</p>
        </footer>
      </div>
    </main>
  )
}
