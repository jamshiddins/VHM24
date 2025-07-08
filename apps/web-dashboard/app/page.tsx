export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          VHM24 - VendHub Manager
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Система управления вендинговыми автоматами
        </p>
        <p className="text-lg text-green-600 font-semibold">
          ⏰ Работает 24 часа в сутки, 7 дней в неделю
        </p>
      </div>
      
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Автоматы онлайн</h3>
          <p className="text-3xl font-bold text-green-600">24/7</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Активных операторов</h3>
          <p className="text-3xl font-bold text-blue-600">12</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Продаж сегодня</h3>
          <p className="text-3xl font-bold text-purple-600">847</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Время работы</h3>
          <p className="text-3xl font-bold text-orange-600">∞</p>
        </div>
      </div>
    </div>
  )
}
