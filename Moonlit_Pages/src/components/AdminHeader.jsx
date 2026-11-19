export default function AdminHeader({ pageTitle }) {
  return (
    <header className="sticky top-0 z-10 flex min-h-[82px] items-center justify-between gap-4 border-b border-[#eadff4] bg-white/85 px-5 backdrop-blur-md sm:px-8">
      <div>
        <p className="text-xs font-medium text-[#a18eaf]">
          Moonlit Pages / Admin
        </p>
        <h1 className="mt-1 text-xl font-bold text-[#493257]">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-[#493257]">
            Administrator
          </p>
          <p className="mt-0.5 text-xs text-[#9585a2]">
            Platform management
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eee4ff] text-lg font-bold text-[#79549b]">
          A
        </div>
      </div>
    </header>
  )
}