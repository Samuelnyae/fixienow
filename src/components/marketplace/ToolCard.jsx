import React from 'react';
import { ShoppingCart, Star, CheckCircle2, Store, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ToolCard({ tool, onAddToCart, cart }) {
  const inCart = cart.some(i => i.id === tool.id);
  const image = tool.image_url || tool.image;
  const isTechnicianListing = tool.seller_type === 'technician';

  return (
    <div className="bg-white rounded-2xl border hover:shadow-md transition-shadow flex flex-col">
      <div className="relative h-44 overflow-hidden bg-gray-100 rounded-t-2xl">
        {image ? (
          <img
            src={image}
            alt={tool.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingCart className="w-10 h-10" />
          </div>
        )}
        {tool.badge && (
          <span className="absolute top-2 left-2 bg-teal-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
            {tool.badge}
          </span>
        )}
        {tool.condition && tool.condition !== 'new' && (
          <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-full capitalize">
            {tool.condition}
          </span>
        )}
        {isTechnicianListing && (
          <span className="absolute bottom-2 left-2 bg-white/90 text-teal-700 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            <User className="w-3 h-3" />
            Technician
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-1">
          {isTechnicianListing ? (
            <User className="w-3 h-3 text-teal-600" />
          ) : (
            <Store className="w-3 h-3 text-gray-400" />
          )}
          <p className="text-xs text-gray-400 truncate">
            {tool.seller_name || (isTechnicianListing ? 'Technician' : 'Fixie Store')}
            {tool.brand ? ` · ${tool.brand}` : ''}
          </p>
        </div>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1">{tool.name}</h3>
        {tool.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{tool.description}</p>
        )}

        <div className="flex items-center gap-1 mb-3">
          {tool.rating > 0 && (
            <>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium">{tool.rating}</span>
              <span className="text-xs text-gray-400">({tool.reviews || 0})</span>
            </>
          )}
          {tool.stock != null && tool.stock < 5 && tool.stock > 0 && (
            <span className="text-xs text-amber-600 ml-auto">Only {tool.stock} left</span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <p className="font-bold text-gray-900">KES {(tool.price || 0).toLocaleString()}</p>
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