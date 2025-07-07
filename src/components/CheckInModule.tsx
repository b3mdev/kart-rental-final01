import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function CheckInModule() {
  const [qrCodeInput, setQrCodeInput] = useState("");
  const [kartAssignment, setKartAssignment] = useState("");
  
  const activeCheckIns = useQuery(api.checkIn.listActiveCheckIns);
  const todayBookings = useQuery(api.bookings.list, { 
    date: new Date().toISOString().split('T')[0] 
  });
  const activeKarts = useQuery(api.karts.list, { status: "active" });
  
  const generateQRCode = useMutation(api.checkIn.generateQRCode);
  const processCheckIn = useMutation(api.checkIn.processCheckIn);

  const handleGenerateQR = async (bookingId: string) => {
    try {
      const qrCode = await generateQRCode({ bookingId: bookingId as any });
      toast.success(`QR Code gerado: ${qrCode}`);
    } catch (error) {
      toast.error("Erro ao gerar QR Code");
    }
  };

  const handleProcessCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCodeInput.trim()) {
      toast.error("Digite o código QR");
      return;
    }

    try {
      await processCheckIn({
        qrCode: qrCodeInput,
        kartAssigned: kartAssignment || undefined,
      });
      toast.success("Check-in processado com sucesso!");
      setQrCodeInput("");
      setKartAssignment("");
    } catch (error) {
      toast.error("Erro ao processar check-in");
    }
  };

  if (!activeCheckIns || !todayBookings || !activeKarts) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const confirmedBookings = todayBookings.filter(b => b.status === "confirmed");
  const scheduledBookings = todayBookings.filter(b => b.status === "scheduled");

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Check-ins Ativos</p>
              <p className="text-2xl font-bold text-blue-600">
                {activeCheckIns.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl">
              ✅
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Correndo Agora</p>
              <p className="text-2xl font-bold text-green-600">
                {activeCheckIns.filter(c => c.status === "racing").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white text-xl">
              🏁
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Agendamentos Hoje</p>
              <p className="text-2xl font-bold text-purple-600">
                {todayBookings.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xl">
              📅
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Karts Disponíveis</p>
              <p className="text-2xl font-bold text-orange-600">
                {activeKarts.length - activeCheckIns.filter(c => c.kartAssigned).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xl">
              🏎️
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-in Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processar Check-in</h3>
          <form onSubmit={handleProcessCheckIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código QR
              </label>
              <input
                type="text"
                value={qrCodeInput}
                onChange={(e) => setQrCodeInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Escaneie ou digite o código QR"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kart Designado (opcional)
              </label>
              <select
                value={kartAssignment}
                onChange={(e) => setKartAssignment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um kart</option>
                {activeKarts
                  .filter(kart => !activeCheckIns.some(c => c.kartAssigned === kart.number))
                  .map((kart) => (
                    <option key={kart._id} value={kart.number}>
                      Kart #{kart.number} - {kart.brand} {kart.model}
                    </option>
                  ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Processar Check-in
            </button>
          </form>
        </div>

        {/* Active Check-ins */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Check-ins Ativos</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activeCheckIns.map((checkIn) => (
              <div key={checkIn._id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {checkIn.pilot?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {checkIn.booking?.startTime} - {checkIn.booking?.endTime}
                    </p>
                    {checkIn.kartAssigned && (
                      <p className="text-sm text-blue-600">
                        Kart #{checkIn.kartAssigned}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    checkIn.status === "racing" ? "bg-green-100 text-green-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {checkIn.status === "racing" ? "Correndo" : "Check-in"}
                  </span>
                </div>
              </div>
            ))}
            {activeCheckIns.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                Nenhum check-in ativo
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Today's Bookings */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Agendamentos de Hoje
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Piloto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horário
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo Kart
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {todayBookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.pilot?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.pilot?.email}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.startTime} - {booking.endTime}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.kartType}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      booking.status === "confirmed" ? "bg-green-100 text-green-800" :
                      booking.status === "scheduled" ? "bg-yellow-100 text-yellow-800" :
                      booking.status === "completed" ? "bg-blue-100 text-blue-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    {booking.status === "scheduled" && (
                      <button
                        onClick={() => handleGenerateQR(booking._id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Gerar QR
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {todayBookings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum agendamento para hoje
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
