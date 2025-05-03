
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { saveApiKey } from '@/services/aiService';
import { toast } from 'sonner';

interface APIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const APIKeyModal: React.FC<APIKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (apiKey.trim()) {
        // Save the API key
        saveApiKey(apiKey.trim());
        toast.success('API key saved successfully');
        setApiKey('');
        onClose();
      } else {
        toast.error('Please enter a valid API key');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set OpenAI API Key</DialogTitle>
          <DialogDescription>
            Enter your OpenAI API key to enable real AI-powered task suggestions.
            Your key is stored locally in your browser and is never sent to our servers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              OpenAI API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full"
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Don't have an API key? Get one at{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                platform.openai.com
              </a>
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={onClose} 
              type="button"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!apiKey.trim() || loading}>
              {loading ? "Saving..." : "Save Key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default APIKeyModal;
