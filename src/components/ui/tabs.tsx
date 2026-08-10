import * as React from "react"
import { cn } from "../../lib/utils"

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  onValueChange: (value: string) => void
}

const Tabs: React.FC<TabsProps> = ({ value, onValueChange, className, children, ...props }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-md backdrop-saturate-150 border border-white/60 dark:border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] p-1 text-muted-foreground w-full sm:w-auto gap-1 relative z-10",
        className
      )}
      {...props}
    />
  )
)
TabsList.displayName = "TabsList"

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    const isSelected = context?.value === value

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isSelected}
        onClick={() => context?.onValueChange(value)}
        className={cn(
          "inline-flex h-full items-center justify-center whitespace-nowrap rounded-full px-5 text-xs font-black tracking-wide cursor-pointer transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 select-none",
          isSelected
            ? "bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 text-white shadow-md shadow-sky-500/30 border border-white/40 font-black scale-[1.03]"
            : "text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50 font-extrabold",
          className
        )}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    if (context?.value !== value) return null

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn("mt-4 focus-visible:outline-none", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
