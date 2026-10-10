export function SushiComingSoon({ step }: { step: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#1c1210] px-6 text-center text-[#fff6ec]">
      <div>
        <p className="text-[18px] font-semibold">Sushi Demo · {step}</p>
        <p className="mt-2 text-[14px] text-[#c9a79a]">这个页面正在制作中,按开发台账 M3 推进,尚未接入真实流程。</p>
      </div>
    </div>
  );
}
