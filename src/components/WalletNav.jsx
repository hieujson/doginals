import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import axios from 'axios';

const WalletNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [seedPhrase, setSeedPhrase] = useState('');
  const { toast } = useToast();

  const handleCreateWallet = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/wallet/new');
      if (response.data.success) {
        const newWallet = response.data.wallet;
        localStorage.setItem('dogecoinWallet', JSON.stringify(newWallet));
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
          <Button>Wallet</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wallet Management</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button onClick={handleCreateWallet} className="w-full">Create New Wallet</Button>
            <div>
              <Input
                placeholder="Enter Private Key"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
              />
            </div>
            <div>
              <Input
                placeholder="Enter Seed Phrase"
                value={seedPhrase}
                onChange={(e) => setSeedPhrase(e.target.value)}
              />
            </div>
            <Button onClick={handleImportWallet} className="w-full">Import Wallet</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletNav;