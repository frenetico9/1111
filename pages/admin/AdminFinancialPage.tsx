import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FinancialTransaction } from '../../types';
import { mockGetFinancialTransactions, mockAddFinancialTransaction } from '../../services/mockApiService';
import { useNotification } from '../../contexts/NotificationContext';
import { useForm } from '../../hooks/useForm';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminFinancialPage: React.FC = () => {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [showModal, setShowModal] = useState(false);
    const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');

    const fetchTransactions = useCallback(async () => {
        if (user) {
            setLoading(true);
            try {
                const data = await mockGetFinancialTransactions(user.id, filterDate);
                setTransactions(data);
            } catch (error) {
                addNotification({ message: 'Erro ao buscar transações.', type: 'error' });
            } finally {
                setLoading(false);
            }
        }
    }, [user, filterDate, addNotification]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const { values, errors, handleChange, handleSubmit, isSubmitting, resetForm } = useForm({
        initialValues: {
            amount: 0,
            description: '',
            paymentMethod: 'cash' as FinancialTransaction['paymentMethod'],
        },
        onSubmit: async (formValues) => {
            if (!user) return;
            const newTransaction: Omit<FinancialTransaction, 'id' | 'barbershopId' | 'date'> = {
                type: transactionType,
                ...formValues
            };
            try {
                await mockAddFinancialTransaction(user.id, filterDate, newTransaction);
                addNotification({ message: 'Transação adicionada com sucesso!', type: 'success' });
                fetchTransactions();
                setShowModal(false);
            } catch (error) {
                addNotification({ message: `Erro ao adicionar transação: ${(error as Error).message}`, type: 'error' });
            }
        },
        validate: (formValues) => {
            const newErrors: any = {};
            if (formValues.amount <= 0) newErrors.amount = "O valor deve ser positivo.";
            if (!formValues.description.trim()) newErrors.description = "A descrição é obrigatória.";
            return newErrors;
        }
    });

    const openModal = (type: 'income' | 'expense') => {
        setTransactionType(type);
        resetForm();
        setShowModal(true);
    };

    const { totalIncome, totalExpense, balance } = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return { totalIncome: income, totalExpense: expense, balance: income - expense };
    }, [transactions]);
    
    const TransactionRow: React.FC<{ tx: FinancialTransaction }> = ({ tx }) => (
        <div className={`p-3 rounded-md flex justify-between items-center ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
            <div>
                <p className="font-medium text-text-dark">{tx.description}</p>
                {tx.paymentMethod && <p className="text-xs text-gray-600 capitalize">Método: {tx.paymentMethod}</p>}
            </div>
            <p className={`font-bold text-lg ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2).replace('.', ',')}
            </p>
        </div>
    );

    return (
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-blue mb-6">Controle Financeiro (Caixa)</h1>

            <div className="mb-6 p-4 bg-white rounded-lg shadow-md flex flex-wrap gap-4 items-end border border-light-blue">
                <div>
                    <label htmlFor="filterDate" className="block text-xs font-medium text-gray-700">Filtrar por Data:</label>
                    <Input
                        type="date"
                        id="filterDate"
                        name="filterDate"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        containerClassName="mb-0"
                        className="mt-1 text-sm py-2"
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="p-5 bg-green-500 text-white rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold">Total de Entradas</h3>
                    <p className="text-3xl font-bold">R$ {totalIncome.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="p-5 bg-red-500 text-white rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold">Total de Saídas</h3>
                    <p className="text-3xl font-bold">R$ {totalExpense.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className={`p-5 rounded-xl shadow-lg ${balance >= 0 ? 'bg-primary-blue' : 'bg-gray-700'} text-white`}>
                    <h3 className="text-lg font-semibold">Saldo do Dia</h3>
                    <p className="text-3xl font-bold">R$ {balance.toFixed(2).replace('.', ',')}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-5 rounded-lg shadow-xl border border-light-blue">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-green-600">Entradas</h2>
                        <Button onClick={() => openModal('income')} variant="primary" size="sm" leftIcon={<span className="material-icons-outlined">add</span>}>Nova Entrada</Button>
                    </div>
                    {loading ? <LoadingSpinner/> : transactions.filter(t => t.type === 'income').length > 0 ? (
                       <div className="space-y-3"> {transactions.filter(t => t.type === 'income').map(tx => <TransactionRow key={tx.id} tx={tx} />)} </div>
                    ) : <p className="text-sm text-center text-gray-500 py-4">Nenhuma entrada registrada para esta data.</p>}
                </div>

                <div className="bg-white p-5 rounded-lg shadow-xl border border-light-blue">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-red-600">Saídas</h2>
                        <Button onClick={() => openModal('expense')} variant="danger" size="sm" leftIcon={<span className="material-icons-outlined">remove</span>}>Nova Saída</Button>
                    </div>
                    {loading ? <LoadingSpinner/> : transactions.filter(t => t.type === 'expense').length > 0 ? (
                        <div className="space-y-3">{transactions.filter(t => t.type === 'expense').map(tx => <TransactionRow key={tx.id} tx={tx} />)}</div>
                    ) : <p className="text-sm text-center text-gray-500 py-4">Nenhuma saída registrada para esta data.</p>}
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={transactionType === 'income' ? 'Adicionar Nova Entrada' : 'Adicionar Nova Saída'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Valor (R$)" name="amount" type="number" step="0.01" min="0.01" value={values.amount.toString()} onChange={handleChange} error={errors.amount} disabled={isSubmitting} />
                    <Input label="Descrição" name="description" value={values.description} onChange={handleChange} error={errors.description} disabled={isSubmitting} />
                    {transactionType === 'income' && (
                        <Input label="Método de Pagamento" type="select" name="paymentMethod" value={values.paymentMethod} onChange={handleChange} disabled={isSubmitting}>
                            <option value="cash">Dinheiro</option>
                            <option value="card">Cartão</option>
                            <option value="pix">Pix</option>
                            <option value="other">Outro</option>
                        </Input>
                    )}
                    <div className="pt-4 flex justify-end space-x-2">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" variant="primary" isLoading={isSubmitting}>Salvar</Button>
                    </div>
                </form>
            </Modal>

        </div>
    );
};

export default AdminFinancialPage;