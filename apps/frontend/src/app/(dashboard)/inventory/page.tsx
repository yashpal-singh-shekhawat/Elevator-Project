'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useInventory } from '@/hooks/queries/use-inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { CreateStockDialog } from './create-stock-dialog';
import { AdjustStockDialog } from './adjust-stock-dialog';

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);

  const { data, isLoading } = useInventory({ page, limit: 20, search: search || undefined, lowStock: lowStock || undefined });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">Spare parts stock — track quantities and BIS/ISI certification</p>
        </div>
        <CreateStockDialog />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search part number or name…"
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button
          variant={lowStock ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setLowStock((v) => !v);
            setPage(1);
          }}
        >
          Low stock only
        </Button>
      </div>

      <div className="rounded-[var(--radius)] border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Part #</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>On hand</TableHead>
              <TableHead>Reorder level</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>BIS/ISI</TableHead>
              <TableHead>Unit cost</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  No inventory records yet.
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((stock) => (
              <TableRow key={stock.id}>
                <TableCell className="font-mono text-xs">{stock.partNumber}</TableCell>
                <TableCell>{stock.partName}</TableCell>
                <TableCell className={stock.quantityOnHand <= stock.reorderLevel ? 'font-semibold text-destructive' : ''}>
                  {stock.quantityOnHand}
                </TableCell>
                <TableCell className="text-muted-foreground">{stock.reorderLevel}</TableCell>
                <TableCell className="text-muted-foreground">{stock.location ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={stock.bisIsiCertified ? 'success' : 'outline'}>{stock.bisIsiCertified ? 'Certified' : 'Not certified'}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{stock.unitCost ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <AdjustStockDialog stockId={stock.id} partName={stock.partName} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="px-3">
          <PaginationControls meta={data?.meta} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
