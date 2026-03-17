import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ShieldCheck, Shield, Clock, Circle } from "lucide-react"

export function UserListSkeleton() {
  return (
    <div className="user-directory">
      <Table>
        <TableHeader className="bg-slate-50/40 backdrop-blur-sm border-b border-slate-100">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[380px] py-4">
              <div className="flex items-center gap-2.5 px-2">
                <div className="p-2 bg-emerald-50 rounded-full text-emerald-600 border border-emerald-100/50">
                  <ShieldCheck size={14} />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">Member Detail</span>
              </div>
            </TableHead>
            <TableHead className="py-4">
              <div className="flex items-center gap-2.5 px-2">
                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                  <Shield size={14} />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">Access Level</span>
              </div>
            </TableHead>
            <TableHead className="py-4">
              <div className="flex items-center gap-2.5 px-2">
                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                  <Clock size={14} />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">Last Session</span>
              </div>
            </TableHead>
            <TableHead className="py-4">
              <div className="flex items-center gap-2.5 px-2">
                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                  <Circle size={14} />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">State</span>
              </div>
            </TableHead>
            <TableHead className="text-right py-4 pr-8">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">Management</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i} className="user-row opacity-60">
              <TableCell className="user-cell">
                <div className="user-info">
                  <Skeleton className="w-[52px] h-[52px] rounded-[18px] border-4 border-white shadow-md shrink-0" />
                  <div className="user-details space-y-1.5">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-28 rounded" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-40 rounded" />
                  </div>
                </div>
              </TableCell>

              <TableCell className="user-cell">
                <Skeleton className="h-6 w-20 rounded-full" />
              </TableCell>

              <TableCell className="user-cell">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-36 rounded-md" />
                </div>
              </TableCell>

              <TableCell className="user-cell">
                <Skeleton className="h-8 w-14 rounded-2xl" />
              </TableCell>

              <TableCell className="user-cell text-right pr-6">
                <Skeleton className="h-9 w-24 rounded-xl ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
