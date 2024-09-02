import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Dogecoin Inscription Service</h1>
        <p className="text-xl text-gray-600 mb-8">Inscribe your data on the Dogecoin network!</p>
        <Button onClick={() => navigate('/inscribe')}>Start Inscribing</Button>
      </div>
    </div>
  );
};

export default Index;