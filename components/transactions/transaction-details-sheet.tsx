"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter,
  SheetClose 
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TransactionsEditDialog } from "./transactions-edit-dialog";
import { Transaction, TransactionsService } from "@/lib/services/transactions.service";
import { Customer, CustomersService } from "@/lib/services/customers.service";
import { Employee, EmployeesService } from "@/lib/services/employees.service";
import { Product } from "@/lib/services/products.service";
import { SoldProduct, SoldProductsService } from "@/lib/services/sold_products.service";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Edit, Trash2, X, CreditCard, ShoppingCart, Calendar, User, Tag, FileText, DollarSign, CheckCircle, Download } from "lucide-react";
import { useDb } from "@/providers/db-provider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFViewer,
  PDFDownloadLink,
  Font
} from "@react-pdf/renderer";

interface TransactionDetailsSheetProps {
  transactionId: string | null;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

// Define el tipo de elemento PDF más específicamente
type PDFDocumentType = React.ReactElement<{ style?: any; children?: React.ReactNode }>;

export const TransactionDetailsSheet = ({
  transactionId,
  onOpenChange,
  onUpdate,
}: TransactionDetailsSheetProps) => {
  // Estados para el componente
  const [open, setOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [soldProducts, setSoldProducts] = useState<(SoldProduct & { product?: Product })[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentType | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Context para productos y store actual
  const { products, selectedStore: currentStore } = useDb();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const actualOpen = !!transactionId;

  useEffect(() => {
    const loadData = async (transactionId: string, products: Product[], currentStore: any, onOpenChange: (open: boolean) => void) => {
      if (transactionId) {
        setIsLoading(true);
        try {
          setSelectedStore(currentStore);
          
          console.log("Cargando detalles de transacción:", transactionId);
          const transaction = await TransactionsService.getTransaction(transactionId);
          setTransaction(transaction);
          console.log("Transacción cargada:", transaction);

          if (transaction.type === "income" && transaction.customer_id) {
            console.log("Cargando detalles de cliente:", transaction.customer_id);
            const customer = await CustomersService.getCustomer(transaction.customer_id);
            setCustomer(customer);
          }

          if (transaction.employee_id) {
            console.log("Cargando detalles de empleado:", transaction.employee_id);
            const employee = await EmployeesService.getEmployee(transaction.employee_id);
            setEmployee(employee);
          }

          // Cargar productos vendidos si es una transacción de ingreso
          if (transaction.type === "income") {
            console.log("Cargando productos vendidos para transacción:", transactionId);
            const soldProductsData = await SoldProductsService.getTransactionProducts(transactionId);
            console.log("Productos vendidos obtenidos:", soldProductsData);
            
            // Enriquecer con datos de producto
            const soldProductsWithProduct = soldProductsData.map((sp: SoldProduct) => {
              const product = products.find((p: Product) => p.id === sp.product_id);
              console.log(`Asociando producto ${sp.product_id}:`, product || "No encontrado");
              return { ...sp, product };
            });
            
            setSoldProducts(soldProductsWithProduct);
            console.log("Productos vendidos con detalles:", soldProductsWithProduct);
          }
        } catch (error) {
          console.error("Error cargando los datos de la transacción:", error);
          toast.error("Error al cargar los datos de la transacción");
        } finally {
          setIsLoading(false);
          onOpenChange(true);
        }
      }
    };

    if (transactionId) {
      loadData(transactionId, products, currentStore, onOpenChange);
    }
  }, [transactionId, products, currentStore, onOpenChange]);

  const resetState = () => {
    setTransaction(null);
    setCustomer(null);
    setEmployee(null);
    setSoldProducts([]);
    setIsEditDialogOpen(false);
    setShowPdfPreview(false);
    setPdfDocument(null); 
    setShowDeleteConfirm(false);
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!transaction) return;
    
    try {
      setIsLoading(true);
      await TransactionsService.deleteTransaction(transaction.id);
      
      toast.success("La transacción ha sido eliminada correctamente");
      
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      console.error("Error eliminando la transacción:", error);
      toast.error("No se pudo eliminar la transacción");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
  };

  const handleUpdateSuccess = () => {
    setIsEditDialogOpen(false);
    if (transaction) {
      const loadData = async (transactionId: string, products: Product[], currentStore: any, onOpenChange: (open: boolean) => void) => {
        if (transactionId) {
          setIsLoading(true);
          try {
            setSelectedStore(currentStore);
            
            const transaction = await TransactionsService.getTransaction(transactionId);
            setTransaction(transaction);

            if (transaction.type === "income" && transaction.customer_id) {
              const customer = await CustomersService.getCustomer(transaction.customer_id);
              setCustomer(customer);
            }

            if (transaction.employee_id) {
              const employee = await EmployeesService.getEmployee(transaction.employee_id);
              setEmployee(employee);
            }

            // Cargar productos vendidos si es una transacción de ingreso
            if (transaction.type === "income") {
              const soldProducts = await SoldProductsService.getTransactionProducts(transactionId);
              // Enriquecer con datos de producto
              const soldProductsWithProduct = soldProducts.map((sp) => {
                const product = products.find((p) => p.id === sp.product_id);
                return { ...sp, product };
              });
              setSoldProducts(soldProductsWithProduct);
            }
          } catch (error) {
            console.error("Error cargando los datos de la transacción:", error);
            toast.error("Error al cargar los datos de la transacción");
          } finally {
            setIsLoading(false);
            onOpenChange(true);
          }
        }
      };

      if (transactionId) {
        loadData(transactionId, products, currentStore, onOpenChange);
      }
    }
    onUpdate();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'outline';
      case 'pending':
        return 'secondary';
      case 'canceled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number, includeSymbol: boolean = true) => {
    return new Intl.NumberFormat("es-CO", {
      style: includeSymbol ? 'currency' : 'decimal',
      currency: "COP",
      minimumFractionDigits: includeSymbol ? 0 : 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", {
      locale: es
    });
  };

  const getCategoryText = (category: string): string => {
    // Para ingresos
    switch(category) {
      case 'sales': return 'Ventas';
      case 'services': return 'Servicios';
      case 'investment_returns': return 'Retornos de inversión';
      case 'interest_income': return 'Ingresos por intereses';
      case 'rental_income': return 'Ingresos por alquiler';
      case 'refunds_received': return 'Reembolsos recibidos';
      case 'other_income': return 'Otros ingresos';
      
      // Para gastos
      case 'cost_of_goods_sold': return 'Costo de productos vendidos';
      case 'salaries_wages': return 'Salarios y sueldos';
      case 'rent': return 'Alquiler';
      case 'utilities': return 'Servicios públicos';
      case 'office_supplies': return 'Suministros de oficina';
      case 'marketing': return 'Marketing';
      case 'travel': return 'Viajes';
      case 'insurance': return 'Seguros';
      case 'professional_services': return 'Servicios profesionales';
      case 'equipment': return 'Equipamiento';
      case 'maintenance': return 'Mantenimiento';
      case 'taxes': return 'Impuestos';
      case 'refunds_issued': return 'Reembolsos emitidos';
      case 'other_expenses': return 'Otros gastos';
      
      default: return category;
    }
  };

  const getStatusText = (status: string): string => {
    switch(status) {
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completado';
      case 'canceled': return 'Cancelado';
      case 'refunded': return 'Reembolsado';
      default: return status;
    }
  };

  const getPaymentMethodText = (method: string | undefined): string => {
    if (!method) return 'No especificado';
    
    switch(method) {
      case 'cash': return 'Efectivo';
      case 'credit_card': return 'Tarjeta de crédito';
      case 'debit_card': return 'Tarjeta de débito';
      case 'transfer': return 'Transferencia';
      case 'others': return 'Otro';
      default: return method;
    }
  };

  // Función para cerrar la previsualización sin errores
  const handleClosePdfPreview = useCallback(() => {
    setShowPdfPreview(false);
    setPdfDocument(null);
  }, []);

  // Efecto para manejar la apertura y cierre de la hoja
  useEffect(() => {
    if (!actualOpen) {
      // Cuando se cierra la hoja, limpiar todos los estados
      resetState();
    }
  }, [actualOpen]);

  // Inicializar el PDF solo cuando sea necesario
  const initPdf = useCallback(() => {
    if (!transaction) return;
    
    // Hacer logs muy claros de los datos que se pasan al PDF
    console.log("🚨🚨 INICIANDO CREACIÓN DE PDF");
    console.log("TRANSACTION:", transaction);
    console.log("CUSTOMER:", customer);
    console.log("EMPLOYEE:", employee);
    console.log("SOLD PRODUCTS:", soldProducts);
    
    // FORZAR que se pase correctamente el PDF document
    const pdfDoc = <TransactionPDF />;
    setPdfDocument(pdfDoc);
    setShowPdfPreview(true);
  }, [transaction, customer, employee, soldProducts]);

  // Utilizar un efecto para manejar la limpieza del PDF
  useEffect(() => {
    return () => {
      // Limpieza al desmontar
      setPdfDocument(null);
    };
  }, []);

  const renderContent = () => {
    if (!transaction) return null;

    const isIncome = transaction.type === "income";
    const transactionAmount = transaction.total_amount || 0;
    const formattedDate = formatDate(transaction.sale_date);
    const statusBadgeVariant = getStatusBadgeVariant(transaction.status);

    return (
      <div className="space-y-4">
        {/* Tipo de transacción (Ingreso/Gasto) */}
        <div className="flex justify-center">
          <Badge 
            variant={isIncome ? "default" : "destructive"}
            className="text-lg py-2 px-4"
          >
            {isIncome ? "INGRESO" : "GASTO"}
            {transaction.category && ` - ${getCategoryText(transaction.category)}`}
          </Badge>
        </div>

        {/* Información principal */}
        <Card>
          <CardContent className="p-6 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{formattedDate}</p>
                </div>
              </div>
              <div className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-bold text-lg">{formatCurrency(transactionAmount)}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center">
                <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Categoría</p>
                  <p className="font-medium">{getCategoryText(transaction.category || '')}</p>
                </div>
              </div>
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={statusBadgeVariant}>
                    {getStatusText(transaction.status)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Método de pago</p>
                  <p className="font-medium">{getPaymentMethodText(transaction.payment_method)}</p>
                </div>
              </div>
              
              {/* Si es gasto, mostrar si es deducible */}
              {!isIncome && (
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Deducible</p>
                    <p className="font-medium">{transaction.deductible ? 'Sí' : 'No'}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cliente para ingresos */}
        {isIncome && customer && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{customer.name}</p>
              {customer.email && <p className="text-sm">{customer.email}</p>}
              {customer.phone && <p className="text-sm">{customer.phone}</p>}
            </CardContent>
          </Card>
        )}

        {/* Empleado para ingresos */}
        {isIncome && employee && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Atendido por</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{employee.name}</p>
              {employee.email && <p className="text-sm">{employee.email}</p>}
              {employee.phone && <p className="text-sm">{employee.phone}</p>}
            </CardContent>
          </Card>
        )}

        {/* Destinatario para gastos */}
        {!isIncome && transaction.recipient && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Destinatario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{transaction.recipient}</p>
            </CardContent>
          </Card>
        )}

        {/* Mostrar productos si es categoría 'sales' */}
        {isIncome && transaction.category === "sales" && soldProducts.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Productos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {soldProducts.map((item: SoldProduct & { product?: Product }) => (
                  <div key={item.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.product?.name || "Producto desconocido"}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x {formatCurrency(item.product?.price || 0, false).replace('COP', '').trim()}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency((item.product?.price || 0) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-muted/50 flex items-center justify-between">
                <p className="font-semibold">Total</p>
                <p className="font-semibold">
                  {formatCurrency(transaction.total_amount)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Descripción */}
        {transaction.description && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{transaction.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderFooterButtons = () => {
    // No mostrar botones cuando se está visualizando el PDF
    if (showPdfPreview) {
      return null;
    }
    
    return (
      <div className="flex gap-2 w-full justify-between">
        <div className="flex gap-2">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline" 
            size="sm" 
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </div>
      </div>
    );
  };

  const renderPDFPreview = () => {
    if (!pdfDocument) return null;
    
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 px-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClosePdfPreview}
            className="mt-2"
          >
            <X className="h-4 w-4 mr-2" />
            Volver a detalles
          </Button>

          <PDFDownloadLink
            document={pdfDocument}
            fileName={`comprobante-${transaction?.id || 'transaccion'}.pdf`}
            className="flex items-center justify-center bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 rounded-md text-sm font-medium"
          >
            {({ loading }) => (
              loading ? (
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  <span>Generando...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  <span>Descargar PDF</span>
                </div>
              )
            )}
          </PDFDownloadLink>
        </div>
        <div className="flex-grow h-[calc(100vh-180px)] overflow-hidden">
          <PDFViewer width="100%" height="100%" className="border-0">
            {pdfDocument}
          </PDFViewer>
        </div>
      </div>
    );
  };

  const renderSheetContent = () => {
    if (showPdfPreview && pdfDocument) {
      return renderPDFPreview();
    }
    return (
      <div className="p-6 overflow-auto">
        {/* Mostrar botón de comprobante en la parte superior */}
        <div className="mb-4 flex justify-end">
          <Button 
            size="sm" 
            onClick={initPdf}
            className="flex items-center"
          >
            <FileText className="h-4 w-4 mr-2" />
            Ver Comprobante
          </Button>
        </div>
        {renderContent()}
      </div>
    );
  };

  const renderFooter = () => {
    return (
      <SheetFooter className="px-6 py-4 border-t mt-auto">
        {renderFooterButtons()}
      </SheetFooter>
    );
  };

  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      padding: 30,
      fontFamily: 'Helvetica',
    },
    header: {
      marginBottom: 20,
      borderBottom: '1pt solid #EEEEEE',
      paddingBottom: 10,
    },
    title: {
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 15,
    },
    section: {
      marginTop: 10,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 6,
    },
    row: {
      flexDirection: 'row',
      marginBottom: 5,
    },
    label: {
      width: 100,
      fontSize: 10,
      color: '#666666',
    },
    value: {
      flex: 1,
      fontSize: 10,
    },
    totalLabel: {
      fontSize: 14,
      fontWeight: 'bold',
      marginRight: 10,
    },
    totalValue: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#EEEEEE',
      paddingVertical: 5,
      paddingHorizontal: 8,
      fontSize: 10,
      fontWeight: 'bold',
      borderBottomWidth: 1,
      borderBottomColor: '#DDDDDD',
      marginTop: 15,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 5,
      paddingHorizontal: 8,
      fontSize: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#EEEEEE',
    },
    col1: { width: '10%' },
    col2: { width: '40%' },
    col3: { width: '15%' },
    col4: { width: '15%' },
    col5: { width: '20%' },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: 8,
      color: '#666666',
    },
    transactionType: {
      padding: 6,
      borderRadius: 4,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    incomeType: {
      backgroundColor: '#DCFCE7',
      color: '#166534',
    },
    expenseType: {
      backgroundColor: '#FEE2E2',
      color: '#991B1B',
    },
  });

  const TransactionPDF = () => {
    // FORZAR acceso a los datos desde el closure
    const currentTransaction = transaction;
    const currentCustomer = customer;
    const currentEmployee = employee;
    const currentProducts = soldProducts;
    
    if (!currentTransaction) {
      console.error("🚨 ERROR: No hay transacción para generar PDF");
      return null;
    }
    
    const isIncome = currentTransaction.type === "income";
    const isSales = currentTransaction.category === "sales";
    
    // Logs muy detallados
    console.log("🚨🚨🚨 GENERANDO PDF 🚨🚨🚨");
    console.log("- Transacción:", currentTransaction);
    console.log("- Cliente:", currentCustomer);
    console.log("- Empleado:", currentEmployee);
    console.log("- Productos:", currentProducts);
    
    // Crear un PDF muy simple pero que muestre TODOS los datos
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Encabezado */}
          <View style={styles.header}>
            <Text style={styles.title}>Comprobante de Transacción</Text>
            <View style={{
              padding: 10,
              backgroundColor: isIncome ? '#DCFCE7' : '#FEE2E2',
              borderRadius: 4,
              marginBottom: 10
            }}>
              <Text style={{
                color: isIncome ? '#166534' : '#991B1B',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                {isIncome ? 'INGRESO' : 'GASTO'} - {getCategoryText(currentTransaction.category || '')}
              </Text>
            </View>
          </View>
          
          {/* Información General */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información General</Text>
            <View style={styles.row}>
              <Text style={styles.label}>ID Transacción:</Text>
              <Text style={styles.value}>{currentTransaction.id}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Fecha:</Text>
              <Text style={styles.value}>{formatDate(currentTransaction.sale_date)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Estado:</Text>
              <Text style={styles.value}>{getStatusText(currentTransaction.status)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Método de pago:</Text>
              <Text style={styles.value}>{getPaymentMethodText(currentTransaction.payment_method || 'cash')}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Categoría:</Text>
              <Text style={styles.value}>{getCategoryText(currentTransaction.category || '')}</Text>
            </View>
            {currentTransaction.description && (
              <View style={styles.row}>
                <Text style={styles.label}>Descripción:</Text>
                <Text style={styles.value}>{currentTransaction.description}</Text>
              </View>
            )}
          </View>
          
          {/* Información de Cliente (SOLO INGRESOS) */}
          {isIncome && currentCustomer && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información del Cliente</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Nombre:</Text>
                <Text style={styles.value}>{currentCustomer.name}</Text>
              </View>
              {currentCustomer.email && (
                <View style={styles.row}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{currentCustomer.email}</Text>
                </View>
              )}
              {currentCustomer.phone && (
                <View style={styles.row}>
                  <Text style={styles.label}>Teléfono:</Text>
                  <Text style={styles.value}>{currentCustomer.phone}</Text>
                </View>
              )}
            </View>
          )}
          
          {/* Empleado (SOLO INGRESOS) */}
          {isIncome && currentEmployee && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Atendido por</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Empleado:</Text>
                <Text style={styles.value}>{currentEmployee.name}</Text>
              </View>
              {currentEmployee.email && (
                <View style={styles.row}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{currentEmployee.email}</Text>
                </View>
              )}
              {currentEmployee.phone && (
                <View style={styles.row}>
                  <Text style={styles.label}>Teléfono:</Text>
                  <Text style={styles.value}>{currentEmployee.phone}</Text>
                </View>
              )}
            </View>
          )}
          
          {/* Destinatario (SOLO GASTOS) */}
          {!isIncome && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información del Gasto</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Destinatario:</Text>
                <Text style={styles.value}>{currentTransaction.recipient || 'No especificado'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Deducible:</Text>
                <Text style={styles.value}>{currentTransaction.deductible ? 'Sí' : 'No'}</Text>
              </View>
            </View>
          )}
          
          {/* Productos (SOLO VENTAS) - FORZAR mostrarlos siempre que existan */}
          {isIncome && isSales && currentProducts && currentProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Productos</Text>
              
              <View style={styles.tableHeader}>
                <Text style={styles.col1}>#</Text>
                <Text style={styles.col2}>Producto</Text>
                <Text style={styles.col3}>Cantidad</Text>
                <Text style={styles.col4}>Precio</Text>
                <Text style={styles.col5}>Subtotal</Text>
              </View>
              
              {currentProducts.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.col1}>{index + 1}</Text>
                  <Text style={styles.col2}>{item.product?.name || "Producto desconocido"}</Text>
                  <Text style={styles.col3}>{item.quantity}</Text>
                  <Text style={styles.col4}>
                    {formatCurrency(item.product?.price || 0, false).replace('COP', '').trim()}
                  </Text>
                  <Text style={styles.col5}>
                    {formatCurrency((item.product?.price || 0) * item.quantity, false).replace('COP', '').trim()}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          <View style={[styles.section, { marginTop: 20, borderTop: '1pt solid #EEEEEE', paddingTop: 10 }]}>
            <View style={[styles.row, { justifyContent: 'flex-end' }]}>
              <Text style={styles.totalLabel}>TOTAL:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(currentTransaction.total_amount)}
              </Text>
            </View>
          </View>
          
          <Text style={{ textAlign: 'center', fontSize: 8, marginTop: 30, color: '#666666' }}>
            7hoSoft - Sistema de Gestión
          </Text>
          <Text style={{ textAlign: 'center', fontSize: 8, marginTop: 5, color: '#666666' }}>
            Documento generado el {format(new Date(), "PPP", { locale: es })}
          </Text>
        </Page>
      </Document>
    );
  };

  // Renderizado condicional basado en si es desktop o móvil
  if (isDesktop) {
    return (
      <>
        <Sheet open={actualOpen} onOpenChange={onOpenChange}>
          <SheetContent 
            className="min-w-max p-0 flex flex-col"
            side="left"
          >
            <SheetHeader className="p-6 text-left">
              <SheetTitle className="text-2xl">
                {showPdfPreview ? "Vista previa del comprobante" : "Detalles de la transacción"}
              </SheetTitle>
            </SheetHeader>
            
            {renderSheetContent()}
            
            {renderFooter()}
          </SheetContent>
        </Sheet>
        
        <TransactionsEditDialog 
          transactionId={transaction?.id || ""} 
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handleUpdateSuccess}
        />
        
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente esta transacción.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  } else {
    return (
      <>
        <Drawer open={actualOpen} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[95vh] flex flex-col">
            <DrawerHeader className="border-b">
              <DrawerTitle>
                {showPdfPreview ? "Vista previa del comprobante" : "Detalles de la transacción"}
              </DrawerTitle>
            </DrawerHeader>
            
            <div className="flex-grow overflow-auto">
              {renderSheetContent()}
            </div>
            
            <DrawerFooter className="border-t p-4">
              {renderFooterButtons()}
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        
        <TransactionsEditDialog 
          transactionId={transaction?.id || ""} 
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handleUpdateSuccess}
        />
        
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente esta transacción.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
}
