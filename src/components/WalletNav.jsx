import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Wallet } from 'lucide-react';
import axios from 'axios';

const WalletNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [wallet, setWallet] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedWallet = localStorage.getItem('dogecoinWallet');
    if (storedWallet) {
      setWallet(JSON.parse(storedWallet));
    }
  }, []);

  const handleCreateWallet = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/wallet/new');
      if (response.data.success) {
        const newWallet = response.data.wallet;
        localStorage.setItem('dogecoinWallet', JSON.stringify(newWallet));
        setWallet(newWallet);
        toast({
          title: "Wallet Created",
          description: `Your new wallet address: ${newWallet.address}`,
        });
        setIsOpen(false);
      }
    } catch (error) {
      toast({
        title: "Wallet Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleImportWallet = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/wallet/import', {
        privateKey,
        seedPhrase
      });
      if (response.data.success) {
        const importedWallet = response.data.wallet;
        localStorage.setItem('dogecoinWallet', JSON.stringify(importedWallet));
        setWallet(importedWallet);
        toast({
          title: "Wallet Imported",
          description: `Your imported wallet address: ${importedWallet.address}`,
        });
        setIsOpen(false);
      }
    } catch (error) {
      toast({
        title: "Wallet Import Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="absolute top-4 right-4">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            {wallet ? 'Wallet Connected' : 'Connect Wallet'}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Wallet Management</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {wallet ? (
              <div className="p-4 bg-gray-100 rounded-lg">
                <p className="font-semibold">Connected Wallet</p>
                <p className="text-sm text-gray-600 break-all">{wallet.address}</p>
              </div>
            ) : (
              <>
                <Button onClick={handleCreateWallet} className="w-full">Create New Wallet</Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or import existing</span>
                  </div>
                </div>
                <Input
                  placeholder="Enter Private Key"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="mb-2"
                />
                <Input
                  placeholder="Enter Seed Phrase"
                  value={seedPhrase}
                  onChange={(e) => setSeedPhrase(e.target.value)}
                  className="mb-2"
                />
                <Button onClick={handleImportWallet} className="w-full" variant="secondary">Import Wallet</Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletNav;