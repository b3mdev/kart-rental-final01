import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function PopulateDbButton() {
  const [isLoading, setIsLoading] = useState(false);
  const setupSampleData = useMutation(api.sampleData.setupSampleData);
  const setupAdditionalData = useMutation(api.additionalData.setupAdditionalData);

  const handlePopulateDb = async () => {
    try {
      setIsLoading(true);
      await setupSampleData();
      await setupAdditionalData();
      toast.success("Banco de dados populado com sucesso!");
    } catch (error) {
      toast.error("Erro ao popular o banco de dados");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePopulateDb}
      disabled={isLoading}
      className="bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <span className="animate-spin">⚡</span>
          <span>Populando...</span>
        </>
      ) : (
        <>
          <span>⚡</span>
          <span>Popular Banco de Dados</span>
        </>
      )}
    </button>
  );
}
