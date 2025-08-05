/**
 * Cross-Platform Identity Bridge Dashboard
 * 
 * User interface for bridging PersonaPass credentials across different platforms:
 * - View supported platforms and their capabilities
 * - Bridge existing credentials to other networks
 * - Verify credentials across multiple platforms
 * - Resolve universal identity across all platforms
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Shuffle, 
  Network, 
  Shield, 
  Search,
  ExternalLink,
  Copy,
  AlertCircle,
  Info
} from 'lucide-react';
import { useCrossPlatformBridge } from '@/hooks/useCrossPlatformBridge';
import { PlatformType } from '@/lib/cross-platform-bridge';
import { useToast } from '@/hooks/use-toast';

export default function CrossPlatformBridgePage() {
  const {
    getSupportedPlatforms,
    platformsState,
    verifyCredentialAcrossPlatforms,
    verificationState,
    resolveIdentity,
    resolveState,
    getPlatformSummary,
    clearStates
  } = useCrossPlatformBridge();

  const { toast } = useToast();

  // UI state
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>([]);
  const [credentialId, setCredentialId] = useState('');
  const [identityIdentifier, setIdentityIdentifier] = useState('');

  // Load platforms on mount
  useEffect(() => {
    getSupportedPlatforms();
  }, [getSupportedPlatforms]);

  // Handle platform selection
  const togglePlatform = (platform: PlatformType) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  // Handle credential verification
  const handleVerifyCredential = async () => {
    if (!credentialId.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a credential ID',
        variant: 'destructive'
      });
      return;
    }

    const result = await verifyCredentialAcrossPlatforms(
      credentialId,
      selectedPlatforms.length > 0 ? selectedPlatforms : undefined
    );

    if (result) {
      const validCount = Object.values(result).filter(Boolean).length;
      const totalCount = Object.keys(result).length;
      
      toast({
        title: 'Verification Complete',
        description: `Verified on ${validCount}/${totalCount} platforms`,
        variant: validCount > 0 ? 'default' : 'destructive'
      });
    }
  };

  // Handle identity resolution
  const handleResolveIdentity = async () => {
    if (!identityIdentifier.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an identity identifier',
        variant: 'destructive'
      });
      return;
    }

    const credentials = await resolveIdentity(identityIdentifier);
    
    if (credentials && credentials.length > 0) {
      toast({
        title: 'Identity Resolved',
        description: `Found ${credentials.length} credentials across platforms`,
        variant: 'default'
      });
    } else {
      toast({
        title: 'No Identity Found',
        description: 'No credentials found for this identifier',
        variant: 'destructive'
      });
    }
  };

  // Get platform status badge
  const getPlatformStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'available':
        return <Badge variant="secondary">Available</Badge>;
      default:
        return <Badge variant="destructive">Unavailable</Badge>;
    }
  };

  // Get verification result icon
  const getVerificationIcon = (isValid: boolean) => {
    return isValid 
      ? <CheckCircle className="h-5 w-5 text-green-500" />
      : <XCircle className="h-5 w-5 text-red-500" />;
  };

  const platformSummary = getPlatformSummary();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shuffle className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Cross-Platform Identity Bridge</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Connect your PersonaPass credentials across blockchain networks and traditional identity systems
          </p>
        </div>

        {/* Platform Summary Cards */}
        {platformSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{platformSummary.total}</p>
                    <p className="text-sm text-gray-600">Total Platforms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{platformSummary.active}</p>
                    <p className="text-sm text-gray-600">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{platformSummary.blockchain}</p>
                    <p className="text-sm text-gray-600">Blockchain</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{platformSummary.identityProviders}</p>
                    <p className="text-sm text-gray-600">Identity Providers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="platforms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="platforms">Supported Platforms</TabsTrigger>
            <TabsTrigger value="verify">Verify Credentials</TabsTrigger>
            <TabsTrigger value="resolve">Resolve Identity</TabsTrigger>
            <TabsTrigger value="bridge">Bridge Credentials</TabsTrigger>
          </TabsList>

          {/* Supported Platforms Tab */}
          <TabsContent value="platforms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Supported Platforms</CardTitle>
                <CardDescription>
                  All platforms supported for cross-platform credential bridging
                </CardDescription>
              </CardHeader>
              <CardContent>
                {platformsState.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading platforms...</span>
                  </div>
                ) : platformsState.error ? (
                  <div className="text-center py-8 text-red-600">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>Error loading platforms: {platformsState.error}</p>
                  </div>
                ) : platformsState.platforms ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {platformsState.platforms.map((platform) => (
                      <Card key={platform.type} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{platform.name}</h3>
                            <p className="text-sm text-gray-600 capitalize">{platform.category.replace('_', ' ')}</p>
                          </div>
                          {getPlatformStatusBadge(platform.status)}
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Shield className="h-4 w-4" />
                            <span>{platform.authentication.description}</span>
                          </div>
                          
                          {platform.capabilities.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {platform.capabilities.map((capability) => (
                                <Badge key={capability} variant="outline" className="text-xs">
                                  {capability}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {platform.features.length > 0 && (
                          <div className="text-xs text-gray-600">
                            <p className="font-medium mb-1">Features:</p>
                            <ul className="space-y-1">
                              {platform.features.slice(0, 3).map((feature, index) => (
                                <li key={index}>• {feature}</li>
                              ))}
                              {platform.features.length > 3 && (
                                <li>• ... and {platform.features.length - 3} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verify Credentials Tab */}
          <TabsContent value="verify" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Verify Credentials Across Platforms</CardTitle>
                <CardDescription>
                  Check if a credential is valid across multiple platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="credentialId">Credential ID</Label>
                  <Input
                    id="credentialId"
                    placeholder="Enter credential ID to verify"
                    value={credentialId}
                    onChange={(e) => setCredentialId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Select Platforms (optional)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {platformsState.platforms?.map((platform) => (
                      <div key={platform.type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={platform.type}
                          checked={selectedPlatforms.includes(platform.type as PlatformType)}
                          onChange={() => togglePlatform(platform.type as PlatformType)}
                          className="rounded"
                        />
                        <label htmlFor={platform.type} className="text-sm font-medium">
                          {platform.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleVerifyCredential}
                  disabled={verificationState.isLoading || !credentialId.trim()}
                  className="w-full"
                >
                  {verificationState.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Verify Credential
                    </>
                  )}
                </Button>

                {/* Verification Results */}
                {verificationState.results && (
                  <div className="mt-6 p-4 border rounded-lg">
                    <h3 className="font-semibold mb-3">Verification Results</h3>
                    <div className="space-y-2">
                      {Object.entries(verificationState.results).map(([platform, isValid]) => (
                        <div key={platform} className="flex items-center justify-between">
                          <span className="font-medium capitalize">{platform.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            {getVerificationIcon(isValid)}
                            <span className={isValid ? 'text-green-600' : 'text-red-600'}>
                              {isValid ? 'Valid' : 'Invalid'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {verificationState.error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Verification Error</span>
                    </div>
                    <p className="mt-1">{verificationState.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resolve Identity Tab */}
          <TabsContent value="resolve" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resolve Universal Identity</CardTitle>
                <CardDescription>
                  Find all credentials associated with an identity across platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identityIdentifier">Identity Identifier</Label>
                  <Input
                    id="identityIdentifier"
                    placeholder="Enter address, email, or DID"
                    value={identityIdentifier}
                    onChange={(e) => setIdentityIdentifier(e.target.value)}
                  />
                  <p className="text-sm text-gray-600">
                    Supports blockchain addresses (0x..., persona1...), email addresses, or DID URIs
                  </p>
                </div>

                <Button 
                  onClick={handleResolveIdentity}
                  disabled={resolveState.isLoading || !identityIdentifier.trim()}
                  className="w-full"
                >
                  {resolveState.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resolving...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Resolve Identity
                    </>
                  )}
                </Button>

                {/* Resolution Results */}
                {resolveState.summary && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">Identity Summary</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total Credentials:</span>
                          <span className="ml-2">{resolveState.summary.totalCredentials}</span>
                        </div>
                        <div>
                          <span className="font-medium">Platform Coverage:</span>
                          <span className="ml-2">{resolveState.summary.platformCount} platforms</span>
                        </div>
                        <div>
                          <span className="font-medium">Confidence Score:</span>
                          <span className="ml-2">{(resolveState.summary.confidenceScore * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="font-medium">Credential Types:</span>
                          <span className="ml-2">{resolveState.summary.credentialTypes.length}</span>
                        </div>
                      </div>
                    </div>

                    {resolveState.credentials && resolveState.credentials.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold">Found Credentials</h3>
                        {resolveState.credentials.map((credential, index) => (
                          <Card key={credential.id} className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium">{credential.type[0]}</h4>
                                <p className="text-sm text-gray-600">ID: {credential.id}</p>
                              </div>
                              <Badge variant="outline">
                                {credential.bridgeMetadata.originalPlatform}
                              </Badge>
                            </div>
                            
                            <div className="text-sm space-y-1">
                              <p><span className="font-medium">Issuer:</span> {credential.issuer}</p>
                              <p><span className="font-medium">Subject:</span> {credential.subject}</p>
                              
                              {credential.bridgeMetadata.bridgedPlatforms.length > 0 && (
                                <div>
                                  <span className="font-medium">Bridged to:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {credential.bridgeMetadata.bridgedPlatforms.map((platform) => (
                                      <Badge key={platform} variant="secondary" className="text-xs">
                                        {platform}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {resolveState.error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Resolution Error</span>
                    </div>
                    <p className="mt-1">{resolveState.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bridge Credentials Tab */}
          <TabsContent value="bridge" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bridge Credentials</CardTitle>
                <CardDescription>
                  Convert your PersonaPass credentials to work on other platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shuffle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Credential Bridging</h3>
                  <p className="text-gray-600 mb-4">
                    This feature allows you to bridge your existing PersonaPass credentials to other blockchain networks and identity systems.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 mb-1">Implementation Status</p>
                        <p className="text-blue-800">
                          The bridging interface is currently in development. You can use the API endpoints directly 
                          or contact support for manual bridging assistance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Clear States Button */}
        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={clearStates}
            className="text-gray-600"
          >
            Clear All Results
          </Button>
        </div>
      </div>
    </div>
  );
}