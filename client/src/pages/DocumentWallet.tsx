import { useState } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Upload, Download, Trash2, FileText, Image, Eye, Plus, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  uploadDate: string;
  size: string;
  url?: string;
}

export default function DocumentWallet() {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Passport_US_2024.pdf',
      type: 'pdf',
      category: 'passport',
      uploadDate: '2024-01-15',
      size: '2.3 MB',
      url: '#'
    },
    {
      id: '2',
      name: 'Travel_Insurance_Policy.pdf',
      type: 'pdf',
      category: 'insurance',
      uploadDate: '2024-01-10',
      size: '1.8 MB',
      url: '#'
    },
    {
      id: '3',
      name: 'Visa_Japan_Photo.jpg',
      type: 'image',
      category: 'visa',
      uploadDate: '2024-01-08',
      size: '0.9 MB',
      url: '#'
    }
  ]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDragOver, setIsDragOver] = useState(false);

  const categories = [
    { value: 'all', label: 'All Documents' },
    { value: 'passport', label: 'Passport' },
    { value: 'visa', label: 'Visa' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'ticket', label: 'Tickets' },
    { value: 'hotel', label: 'Hotel Bookings' },
    { value: 'other', label: 'Other' }
  ];

  const filteredDocuments = selectedCategory === 'all' 
    ? documents 
    : documents.filter(doc => doc.category === selectedCategory);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      const newDoc: Document = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type.includes('image') ? 'image' : 'pdf',
        category: 'other',
        uploadDate: new Date().toISOString().split('T')[0],
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        url: URL.createObjectURL(file)
      };
      
      setDocuments(prev => [...prev, newDoc]);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const getDocumentIcon = (type: string) => {
    return type === 'image' ? Image : FileText;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      passport: '🛂',
      visa: '📋',
      insurance: '🛡️',
      ticket: '🎫',
      hotel: '🏨',
      other: '📄'
    };
    return icons[category as keyof typeof icons] || '📄';
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-display mb-4">Travel Document Wallet</h1>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Securely store and organize all your travel documents in one place. Upload passports, visas, insurance, and tickets.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Upload Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="shadow-elegant-lg border-0">
              <CardContent className="p-8">
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    isDragOver 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/20 hover:border-primary/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Documents</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop files here or click to browse
                  </p>
                  <button 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition-all duration-300 flex items-center space-x-2"
                    aria-label="Upload travel documents"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Document</span>
                  </button>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports PDF, JPG, PNG files up to 10MB each
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0"
          >
            <div className="flex items-center space-x-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-sm text-muted-foreground">
                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>

          {/* Documents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {filteredDocuments.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredDocuments.map((doc, index) => {
                  const IconComponent = getDocumentIcon(doc.type);
                  
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className={`shadow-elegant hover:shadow-elegant-lg transition-shadow border-0 ${
                        viewMode === 'list' ? 'p-4' : ''
                      }`}>
                        <CardContent className={viewMode === 'grid' ? 'p-6' : 'p-0'}>
                          <div className={`flex ${viewMode === 'grid' ? 'flex-col space-y-4' : 'items-center space-x-4'}`}>
                            {/* Document Preview */}
                            <div className={`${
                              viewMode === 'grid' 
                                ? 'w-full h-32 bg-muted/50 rounded-lg flex items-center justify-center' 
                                : 'w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center flex-shrink-0'
                            }`}>
                              <span className="text-2xl">{getCategoryIcon(doc.category)}</span>
                            </div>

                            {/* Document Info */}
                            <div className={`${viewMode === 'grid' ? 'space-y-2' : 'flex-1 min-w-0'}`}>
                              <h3 className={`font-semibold ${viewMode === 'list' ? 'truncate' : ''}`}>
                                {doc.name}
                              </h3>
                              <div className={`text-sm text-muted-foreground ${
                                viewMode === 'grid' ? 'space-y-1' : 'flex items-center space-x-4'
                              }`}>
                                <span>Uploaded {doc.uploadDate}</span>
                                <span className={viewMode === 'list' ? '' : 'block'}>Size: {doc.size}</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className={`flex ${
                              viewMode === 'grid' ? 'justify-center space-x-2' : 'space-x-2'
                            }`}>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                                {viewMode === 'grid' && <span className="ml-2">View</span>}
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4" />
                                {viewMode === 'grid' && <span className="ml-2">Download</span>}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => deleteDocument(doc.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                                {viewMode === 'grid' && <span className="ml-2">Delete</span>}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <Card className="shadow-elegant-lg border-0">
                <CardContent className="p-12 text-center">
                  <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {selectedCategory === 'all' 
                      ? 'Upload your first travel document to get started'
                      : `No documents found in the ${categories.find(c => c.value === selectedCategory)?.label} category`
                    }
                  </p>
                  <button 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-4 py-2 rounded-md font-semibold shadow-sm transition-all duration-300"
                    aria-label="Upload your first travel document"
                  >
                    Upload Document
                  </button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}