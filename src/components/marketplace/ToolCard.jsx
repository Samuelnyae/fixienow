import React from 'react';
import { ShoppingCart, Star, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ToolCard({ tool, onAddToCart, cart }) {
  const inCart = cart.some(i => i.id === tool.id);

  return (
    <div className="bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <img
          src={tool.image}
          alt={tool.name}
          className="w-full h-full object-cover"
        />
        {tool.badge && (
          <span className="absolute top-2 left-2 bg-teal-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
            {tool.badge}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-gray-400 mb-1">{tool.brand}</p>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1">{tool.name}</h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{tool.description}</p>

        <div className="flex items-center gap-1 mb-3">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-sm font-medium">{tool.rating}</span>
          <span className="text-xs text-gray-400">({tool.reviews})</span>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <p className="font-bold text-gray-900">KES {tool.price.toLocaleString()}</p>
          <Button
            size="sm"
            onClick={() => onAddToCart(tool)}
            className={inCart ? 'bg-green-600 hover:bg-green-700' : 'bg-teal-600 hover:bg-teal-700'}
          >
            {inCart ? (
              <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Added</>
            ) : (
              <><ShoppingCart className="w-3.5 h-3.5 mr-1" />Add</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}