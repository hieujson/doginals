import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api'; // Update this with your actual backend URL

const InscriptionService = () => {
  const [address, setAddress] = useState('');
  const [contentType, setContentType] = useState('');
  const [data, setData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/wallet/balance`);
      setWalletBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const handleInscribe = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/inscribe`, {
        address,
        contentType,
        data: Buffer.from(data).toString('hex')
      });
      
      if (response.data.success) {
        toast({
          title: "Inscription Successful",
          description: `Your data has been inscribed. TXID: ${response.data.txid}`,
        });
        fetchWalletBalance(); // Refresh balance after inscription
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
      <div className="mb-4">
        <p>Wallet Balance: {walletBalance} satoshis</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="address">Dogecoin Address</Label>
          <Input
            id="address"
            placeholder="Enter your Dogecoin address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
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
        <Button onClick={handleInscribe} disabled={isLoading}>
          {isLoading ? 'Inscribing...' : 'Inscribe Data'}
        </Button>
      </div>
    </div>
  );
};

export default InscriptionService;