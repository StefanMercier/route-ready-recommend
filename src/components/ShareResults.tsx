
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share, Mail, MessageCircle, Copy, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface TravelCalculation {
  totalDistance: number;
  roundTripDistance: number;
  drivingTime: number;
  restStops: number;
  totalTravelTime: number;
  recommendation: 'motorcoach' | 'flight';
}

interface ShareResultsProps {
  departure: string;
  destination: string;
  result: TravelCalculation;
}

const ShareResults: React.FC<ShareResultsProps> = ({ departure, destination, result }) => {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const formatTime = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const shareText = `Travel Route: ${departure} to ${destination}
Distance: ${result.totalDistance.toFixed(0)} miles
Travel Time: ${formatTime(result.totalTravelTime)}
Recommendation: ${result.recommendation === 'flight' ? 'Flight' : 'Motorcoach'}

Calculated with Travel Planner`;

  const shareUrl = window.location.href;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Route details copied successfully",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Travel Route: ${departure} to ${destination}`);
    const body = encodeURIComponent(shareText);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleSocialShare = () => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareUrl);
    
    if (navigator.share) {
      navigator.share({
        title: `Travel Route: ${departure} to ${destination}`,
        text: shareText,
        url: shareUrl,
      }).catch(console.error);
    } else {
      // Fallback to Twitter
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share className="h-5 w-5" />
          Share Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={handleCopyLink}
            variant="outline"
            className="flex items-center gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Details'}
          </Button>
          
          <Button 
            onClick={handleEmailShare}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Email
          </Button>
          
          <Button 
            onClick={handleSocialShare}
            variant="outline"
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareResults;
