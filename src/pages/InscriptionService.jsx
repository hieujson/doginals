import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const InscriptionService = () => {
  const [address, setAddress] = useState('');
  const [contentType, setContentType] = useState('');
  const [data, setData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [wallet, setWallet] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedWallet = localStorage.getItem('dogecoinWallet');
    if (storedWallet) {
      setWallet(JSON.parse(storedWallet));
    }
  }, []);

  useEffect(() => {
    if (wallet) {
      fetchWalletBalance();
    }
  }, [wallet]);

  const fetchWalletBalance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/wallet/balance`);
      setWalletBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const handleCreateWallet = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/wallet/new`);
      if (response.data.success) {
        const newWallet = response.data.wallet;
        setWallet(newWallet);
        localStorage.setItem('dogecoinWallet', JSON.stringify(newWallet));
        toast({
          title: "Wallet Created",
          description: `Your new wallet address: ${newWallet.address}`,
        });
      }
    } catch (error) {
      toast({
        title: "Wallet Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleInscribe = async () => {
    if (!wallet) {
      toast({
        title: "No Wallet",
        description: "Please create a wallet first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/inscribe`, {
        address: wallet.address,
        contentType,
        data: Buffer.from(data).toString('hex')
      });
      
      if (response.data.success) {
        toast({
          title: "Inscription Successful",
          description: `Your data has been inscribed. TXID: ${response.data.txid}`,
        });
        fetchWalletBalance();
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      toast({
        title: "Inscription Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dogecoin Inscription Service</h1>
      <Alert className="mb-4">
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          This service allows you to inscribe data on the Dogecoin network. Please ensure you understand the process and fees involved.
        </AlertDescription>
      </Alert>
      {!wallet ? (
        <div className="mb-4">
          <Button onClick={handleCreateWallet}>Create New Wallet</Button>
        </div>
      ) : (
        <div className="mb-4">
          <p>Wallet Address: {wallet.address}</p>
          <p>Wallet Balance: {walletBalance} satoshis</p>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <Label htmlFor="contentType">Content Type</Label>
          <Input
            id="contentType"
            placeholder="e.g., text/plain, image/png"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="data">Data to Inscribe</Label>
          <Textarea
            id="data"
            placeholder="Enter the data you want to inscribe"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </div>
        <Button onClick={handleInscribe} disabled={isLoading || !wallet}>
          {isLoading ? 'Inscribing...' : 'Inscribe Data'}
        </Button>
      </div>
    </div>
  );
};

export default InscriptionService;