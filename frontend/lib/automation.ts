// Shared automation pipeline definition
export const PIPELINE_STEPS: { worker_id: string; name: string }[] = [
  { worker_id: "producer",   name: "Продюсер — план А→Б"           },
  { worker_id: "strategist", name: "Стратег — стратегия роста"     },
  { worker_id: "copywriter", name: "Копирайтер — контент-пакет"    },
  { worker_id: "metaads",    name: "Таргетолог — рекламные тексты" },
];
