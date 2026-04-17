import React, { useState, useRef } from 'react';
import { ShoppingBag, ArrowLeft, ShoppingCart, Check, Copy, UploadCloud, X, Phone, User as UserIcon, Shirt, Info, FileUp } from 'lucide-react';
import { Button } from './Button';
import { UniformItem, User, UniformOrder } from '../types';
import { useLanguage } from '../src/i18n/LanguageContext';
import { supabase } from '../src/integrations/supabase/client';

interface StoreCatalogProps {
  items: UniformItem[];
  prices: Record<string, number>;
  onBack: () => void;
  isPublic?: boolean;
  user?: User | null;
  onAddOrder?: (order: Omit<UniformOrder, 'id' | 'created_at'>) => Promise<void>;
  onNotifyAdmin?: (action: string, user: User | any) => void;
}

export const StoreCatalog: React.FC<StoreCatalogProps> = ({ 
  items, 
  prices, 
  onBack,
  isPublic = false,
  user = null,
  onAddOrder,
  onNotifyAdmin
}) => {
  const { t } = useLanguage();
  
  // State for order process
  const [selectedItem, setSelectedItem] = useState<UniformItem | null>(null);
  const [orderStep, setOrderStep] = useState<'form' | 'payment'>('form');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [shirtSize, setShirtSize] = useState('');
  const [pantsSize, setPantsSize] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PIX_KEY = 'b6da3596-0aec-41ce-b118-47e4757a24d6';

  const resetOrder = () => {
    setSelectedItem(null);
    setOrderStep('form');
    setGuestName('');
    setGuestPhone('');
    setShirtSize('');
    setPantsSize('');
    setProofFile(null);
    setUploading(false);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleSubmitOrder = async () => {
    if (!selectedItem) return;
    if (isPublic && (!guestName || !guestPhone)) {
      alert('Por favor, preencha seu nome e contato.');
      return;
    }

    setUploading(true);
    try {
      let proof_url = '';
      let proof_name = '';

      // 1. Upload proof if provided
      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `store_proofs/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment_proofs')
          .upload(filePath, proofFile);

        if (uploadError) throw uploadError;
        proof_url = uploadData.path;
        proof_name = proofFile.name;
      }

      // 2. Prepare order data
      const orderData: Omit<UniformOrder, 'id' | 'created_at'> = {
        user_id: user?.id || '00000000-0000-0000-0000-000000000000', // Null-safe or guest UUID
        user_name: user ? (user.nickname || user.name) : `Visitante: ${guestName} (${guestPhone})`,
        user_role: user?.role || 'convidado',
        date: new Date().toLocaleDateString('pt-BR'),
        item: selectedItem.title,
        shirt_size: shirtSize || undefined,
        pants_size: pantsSize || undefined,
        total: selectedItem.price || 0,
        status: 'pending',
        proof_url,
        proof_name
      };

      // 3. Save order
      if (onAddOrder) {
        await onAddOrder(orderData);
      } else {
        // Fallback if prop not provided (guest mode usually handled here)
        const { error } = await supabase.from('uniform_orders').insert(orderData);
        if (error) throw error;
      }

      // 4. Notify admin
      if (onNotifyAdmin) {
        onNotifyAdmin(`Novo pedido da loja (${selectedItem.title}) por ${orderData.user_name}`, user || { name: guestName, role: 'guest' });
      }

      alert('Pedido realizado com sucesso! Aguarde a confirmação da nossa equipe.');
      resetOrder();
    } catch (error: any) {
      console.error('Error placing order:', error);
      alert('Erro ao realizar pedido: ' + (error.message || 'Verifique sua conexão.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-sky-100 rounded-2xl p-6 border border-sky-300 animate-fade-in shadow-2xl min-h-[70vh] relative">
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
                    <Button 
                      fullWidth 
                      onClick={() => setSelectedItem(item)}
                      className="bg-gradient-to-r from-amber-600 to-amber-500 shadow-lg shadow-amber-900/20 py-3 rounded-2xl"
                    >
                      <ShoppingCart size={18} className="mr-2" /> {t('aluno.store.order') || 'Pedir este item'}
                    </Button>
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
              Nossa loja é aberta a todos. Os pedidos são realizados através deste portal e confirmados pela equipe administrativa após o envio do comprovante. Pagamentos via PIX garantem agilidade no processamento.
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

      {/* ORDER MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in shadow-2xl">
          <div className="bg-white rounded-[2.5rem] border border-sky-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col h-full max-h-[90vh]">
            {/* Header */}
            <div className="p-6 bg-sky-50 border-b border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Fazer Pedido</h3>
                  <p className="text-xs text-gray-500 font-bold">{selectedItem.title}</p>
                </div>
              </div>
              <button 
                onClick={resetOrder}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {orderStep === 'form' ? (
                <>
                  <div className="space-y-6">
                    {/* User Info (Guest Only) */}
                    {(!user) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <UserIcon size={14} className="text-sky-500" /> Seu Nome
                          </label>
                          <input 
                            type="text" 
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="w-full bg-sky-50 border border-sky-200 rounded-2xl p-4 text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:text-gray-300"
                            placeholder="Nome Completo"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Phone size={14} className="text-sky-500" /> WhatsApp
                          </label>
                          <input 
                            type="text" 
                            value={guestPhone}
                            onChange={(e) => setGuestPhone(e.target.value)}
                            className="w-full bg-sky-50 border border-sky-200 rounded-2xl p-4 text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:text-gray-300"
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                      </div>
                    )}

                    {/* Size Selection (If applicable based on title) */}
                    {(selectedItem.title.toLowerCase().includes('blusa') || selectedItem.title.toLowerCase().includes('camisa') || selectedItem.title.toLowerCase().includes('combo')) && (
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Shirt size={14} className="text-sky-500" /> Tamanho da Blusa
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {['P', 'M', 'G', 'GG', 'XG'].map(s => (
                            <button
                              key={s}
                              onClick={() => setShirtSize(s)}
                              className={`py-3 rounded-xl border text-sm font-black transition-all ${shirtSize === s ? 'bg-amber-500 border-amber-500 text-white shadow-lg' : 'bg-white border-sky-200 text-gray-600 hover:border-sky-400'}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(selectedItem.title.toLowerCase().includes('calça') || selectedItem.title.toLowerCase().includes('combo')) && (
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Info size={14} className="text-sky-500" /> Tamanho da Calça
                        </label>
                        <input 
                          type="text" 
                          value={pantsSize}
                          onChange={(e) => setPantsSize(e.target.value)}
                          className="w-full bg-sky-50 border border-sky-200 rounded-2xl p-4 text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                          placeholder="Ex: 38, 40, 42..."
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                    <div className="flex justify-between items-center">
                      <span className="text-amber-900 font-bold tracking-tight">Total do Pedido</span>
                      <span className="text-2xl font-black text-amber-700">
                        {selectedItem.price != null ? `R$ ${Number(selectedItem.price).toFixed(2).replace('.', ',')}` : 'Sob consulta'}
                      </span>
                    </div>
                  </div>

                  <Button 
                    fullWidth 
                    className="bg-gray-900 text-white py-5 rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-gray-800 shadow-xl shadow-gray-200"
                    onClick={() => setOrderStep('payment')}
                  >
                    Próximo Passo
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-8 animate-fade-in">
                    {/* PIX Key Section */}
                    <div className="text-center space-y-4">
                      <div className="bg-sky-50 p-6 rounded-3xl border border-sky-100 inline-block mx-auto">
                        <p className="text-xs font-black text-sky-600 uppercase tracking-widest mb-3">Chave PIX (CNPJ)</p>
                        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-sky-200 shadow-sm">
                          <code className="text-sm font-mono font-bold text-gray-900">{PIX_KEY}</code>
                          <button 
                            onClick={handleCopyPix}
                            className={`p-2 rounded-xl transition-all ${pixCopied ? 'bg-green-500 text-white' : 'bg-sky-100 text-sky-600 hover:bg-sky-200'}`}
                          >
                            {pixCopied ? <Check size={18} /> : <Copy size={18} />}
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-4 font-bold uppercase italic">Beneficiário: Andre Luis Guerreiro Nobrega</p>
                      </div>
                    </div>

                    {/* Proof Upload */}
                    <div className="space-y-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <UploadCloud size={14} className="text-sky-500" /> Anexar Comprovante
                      </label>
                      
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-4 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${proofFile ? 'border-green-400 bg-green-50' : 'border-sky-200 bg-sky-50 hover:border-amber-400 hover:bg-amber-50'}`}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          onChange={handleFileChange}
                          accept="image/*, application/pdf"
                        />
                        {proofFile ? (
                          <>
                            <div className="bg-green-500 text-white p-3 rounded-full mb-3 shadow-lg">
                              <Check size={32} />
                            </div>
                            <span className="text-sm font-black text-green-700 truncate max-w-full italic px-4">
                              {proofFile.name}
                            </span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setProofFile(null); }}
                              className="text-xs text-red-600 font-bold mt-2 hover:underline"
                            >
                              Remover arquivo
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="bg-sky-200 text-sky-600 p-3 rounded-full mb-3">
                              <FileUp size={32} />
                            </div>
                            <span className="text-sm font-black text-gray-400">{t('common.upload_proof') || 'Clique para enviar comprovante'}</span>
                            <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">(IMG ou PDF)</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button 
                        variant="ghost" 
                        onClick={() => setOrderStep('form')}
                        className="flex-1 py-5 rounded-2xl text-gray-500 font-black uppercase tracking-widest"
                      >
                        Voltar
                      </Button>
                      <Button 
                        onClick={handleSubmitOrder}
                        disabled={uploading || !proofFile}
                        className="flex-[2] bg-emerald-600 text-white py-5 rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-200 disabled:opacity-50"
                      >
                        {uploading ? 'Processando...' : 'Finalizar Pedido'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Footer shadow fade */}
            <div className="h-6 bg-gradient-to-t from-white to-transparent"></div>
          </div>
        </div>
      )}
    </div>
  );
};
