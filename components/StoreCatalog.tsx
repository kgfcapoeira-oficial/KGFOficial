import React from 'react';
import { ShoppingBag, ArrowLeft, ShoppingCart } from 'lucide-react';
import { Button } from './Button';
import { UniformItem } from '../types';
import { useLanguage } from '../src/i18n/LanguageContext';

interface StoreCatalogProps {
  items: UniformItem[];
  prices: Record<string, number>;
  onBack: () => void;
  isPublic?: boolean;
}

export const StoreCatalog: React.FC<StoreCatalogProps> = ({ 
  items, 
  prices, 
  onBack,
  isPublic = false 
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-sky-100 rounded-2xl p-6 border border-sky-300 animate-fade-in shadow-2xl min-h-[70vh]">
      <div className="max-w-7xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6 text-gray-600 p-0 hover:text-gray-900 flex items-center gap-2 group transition-all" 
          onClick={onBack}
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          {t('common.back_panel') || 'Voltar'}
        </Button>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10 pb-6 border-b border-sky-200">
          <div>
            <h2 className="text-4xl font-black text-gray-900 flex items-center gap-3 tracking-tighter uppercase">
              <ShoppingBag className="text-amber-600 h-10 w-10" /> 
              {t('aluno.store.title') || 'Nossa Loja Virtual'}
            </h2>
            <p className="text-lg text-gray-600 mt-2 font-medium">
              {t('aluno.store.subtitle') || 'Acompanhe nosso catálogo de itens personalizados e acessórios.'}
            </p>
          </div>
          <div className="bg-white px-6 py-2 rounded-full border border-sky-200 shadow-sm flex items-center gap-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('common.catalog') || 'Catálogo'}</span>
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-sm font-bold text-gray-900">{items.length} {t('common.items') || 'Itens'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {items.length > 0 ? (
            items.map(item => (
              <div 
                key={item.id} 
                className="bg-white rounded-3xl border border-sky-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full hover:translate-y-[-4px]"
              >
                <div className="relative aspect-square overflow-hidden bg-sky-50">
                  <img 
                    src={item.image_url} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  <div className="absolute top-4 right-4">
                    <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-amber-600 border border-amber-100 shadow-sm">
                      KGF ©
                    </span>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-4">
                    <h4 className="text-xl font-black text-gray-900 leading-tight mb-2 group-hover:text-amber-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-2xl font-bold text-emerald-700 font-mono">
                      {item.price != null ? `R$ ${Number(item.price).toFixed(2).replace('.', ',')}` : 'Sob consulta'}
                    </p>
                  </div>
                  
                  {item.description && (
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                      {item.description}
                    </p>
                  )}

                  <div className="pt-4 mt-auto border-t border-sky-50">
                    {isPublic ? (
                      <div className="bg-sky-50 rounded-xl p-3 text-center border border-sky-100">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">
                          {t('store.public_info_title') || 'Interessado?'}
                        </p>
                        <p className="text-[9px] text-gray-500 leading-tight font-medium">
                          {t('store.public_info_desc') || 'Faça login ou procure um instrutor para adquirir.'}
                        </p>
                      </div>
                    ) : (
                      <Button fullWidth className="bg-gradient-to-r from-amber-600 to-amber-500 shadow-lg shadow-amber-900/20 py-3 rounded-2xl">
                        <ShoppingCart size={18} className="mr-2" /> {t('aluno.store.order') || 'Pedir este item'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-32 bg-white/50 rounded-3xl border-2 border-dashed border-sky-300 text-center">
              <div className="bg-sky-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag size={40} className="text-sky-300" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter">
                {t('aluno.store.no_items') || 'Opa! Nada por aqui ainda.'}
              </h3>
              <p className="text-gray-500 font-medium">
                {t('aluno.store.no_items_desc') || 'Nosso catálogo está sendo atualizado. Volte em breve!'}
              </p>
            </div>
          )}
        </div>

        {/* Informações de Encomenda */}
        <div className="mt-16 bg-white/40 backdrop-blur-md rounded-3xl p-8 border border-sky-300/50 flex flex-col md:flex-row items-center gap-8 shadow-inner">
          <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-600">
            <ShoppingCart size={40} />
          </div>
          <div>
            <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
              {t('store.how_to_buy') || 'Como funcionam os pedidos?'}
            </h4>
            <p className="text-gray-600 text-sm mt-1 leading-relaxed max-w-2xl">
              Nossa loja é exclusiva para membros do grupo. Os pedidos são realizados através deste portal e confirmados pela equipe administrativa. A retirada dos itens é feita diretamente nos polos de treinamento.
            </p>
          </div>
          <div className="md:ml-auto w-full md:w-auto">
            <Button 
              variant="outline" 
              onClick={isPublic ? onBack : () => {}} 
              className="w-full md:w-auto px-10 border-sky-300 text-gray-600 hover:text-gray-900 bg-white shadow-sm"
            >
              {isPublic ? t('common.back_home') || 'Voltar ao Início' : t('common.learn_more') || 'Saiba Mais'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
