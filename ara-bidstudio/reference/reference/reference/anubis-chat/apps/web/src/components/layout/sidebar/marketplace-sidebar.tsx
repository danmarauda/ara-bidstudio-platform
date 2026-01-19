'use client';

import { Package, Star, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function MarketplaceSidebar() {
  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <h2 className="font-semibold text-lg">Marketplace</h2>
        <p className="text-muted-foreground text-sm">Browse agents & tools</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 font-medium text-sm">Categories</h3>
            <div className="space-y-1">
              <div className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Trending</span>
              </div>
              <div className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted">
                <Star className="h-4 w-4" />
                <span className="text-sm">Featured</span>
              </div>
              <div className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted">
                <Package className="h-4 w-4" />
                <span className="text-sm">All Products</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-medium text-sm">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              <Badge className="text-xs" variant="secondary">
                Trading
              </Badge>
              <Badge className="text-xs" variant="secondary">
                DeFi
              </Badge>
              <Badge className="text-xs" variant="secondary">
                NFT
              </Badge>
              <Badge className="text-xs" variant="secondary">
                Analytics
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
