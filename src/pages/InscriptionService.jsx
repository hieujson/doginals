import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const InscriptionService = () => {
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

  const handleInscribe = async () => {
    if (!wallet) {
      toast({
        title: "No Wallet",
        description: "Please connect a wallet first.",
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
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Dogecoin Inscription Service</CardTitle>
          <CardDescription>Inscribe your data on the Dogecoin network</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              This service allows you to inscribe data on the Dogecoin network. Please ensure you understand the process and fees involved.
            </AlertDescription>
          </Alert>
          
          {wallet ? (
            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
              <p className="font-semibold">Connected Wallet</p>
              <p className="text-sm text-gray-600 break-all">{wallet.address}</p>
              <p className="mt-2">Balance: {walletBalance} satoshis</p>
            </div>
          ) : (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>No Wallet Connected</AlertTitle>
              <AlertDescription>
                Please connect a wallet using the button in the top right corner before inscribing.
              </AlertDescription>
            </Alert>
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
                rows={5}
              />
            </div>
            <Button 
              onClick={handleInscribe} 
              disabled={isLoading || !wallet} 
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inscribing...
                </>
              ) : (
                'Inscribe Data'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InscriptionService;