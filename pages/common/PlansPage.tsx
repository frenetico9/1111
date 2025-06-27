import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import { DETAILED_FEATURES_COMPARISON } from '../../constants';

const CheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-6 h-6 ${className}`}>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
);
const CrossIcon: React.FC<{className?: string}> = ({className}) => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-6 h-6 ${className}`}>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
);

const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
        return value ? <CheckIcon className="text-green-500 mx-auto" /> : <CrossIcon className="text-gray-400 mx-auto" />;
    }
    return <span className="font-semibold text-text-dark">{value}</span>;
};


const PlansPage: React.FC = () => {
    const categories = [...new Set(DETAILED_FEATURES_COMPARISON.map(f => f.category))];

    return (
        <div className="py-12 md:py-20 bg-surface animate-fade-in-up">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-text-dark">Nossos <span className="text-primary-blue">Planos</span></h1>
                    <p className="text-lg text-text-light mt-4 max-w-3xl mx-auto">
                        Escolha o plano ideal para o tamanho do seu negócio. Comece grátis e evolua para o PRO quando estiver pronto para crescer.
                    </p>
                </div>
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-border-color">
                        <table className="w-full text-sm text-center">
                            <thead className="bg-white">
                                <tr>
                                    <th className="p-6 text-left text-lg font-bold text-text-dark w-1/2">Funcionalidades</th>
                                    <th className="p-6 text-lg font-bold text-text-dark border-l border-border-color">Grátis</th>
                                    <th className="p-6 text-lg font-bold text-primary-blue border-l border-border-color relative">
                                        PRO
                                        <div className="absolute -top-0 left-1/2 -translate-x-1/2 bg-primary-blue text-white text-xs font-bold px-3 py-1 rounded-b-md">RECOMENDADO</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map(category => (
                                    <Fragment key={category}>
                                        <tr className="bg-surface">
                                            <td colSpan={3} className="p-3 text-left font-bold text-primary-blue">{category}</td>
                                        </tr>
                                        {DETAILED_FEATURES_COMPARISON.filter(f => f.category === category).map(featureItem => (
                                            <tr key={featureItem.feature} className="border-t border-border-color hover:bg-light-blue/50">
                                                <td className="p-4 text-left text-text-light">{featureItem.feature}</td>
                                                <td className="p-4 border-l border-border-color">{renderFeatureValue(featureItem.free)}</td>
                                                <td className="p-4 border-l border-border-color">{renderFeatureValue(featureItem.pro)}</td>
                                            </tr>
                                        ))}
                                    </Fragment>
                                ))}
                            </tbody>
                             <tfoot className="bg-white">
                                <tr className="border-t-2 border-primary-blue">
                                     <td className="p-6 text-left">
                                        <p className="font-bold text-text-dark">Invista no seu crescimento</p>
                                        <p className="text-xs text-text-light">Escolha um plano e comece a transformar seu negócio hoje.</p>
                                     </td>
                                     <td className="p-6 border-l border-border-color">
                                        <Link to="/signup/barbershop"><Button variant="outline" fullWidth>Começar Grátis</Button></Link>
                                     </td>
                                     <td className="p-6 border-l border-border-color">
                                        <Link to="/signup/barbershop"><Button variant="primary" fullWidth>Assinar PRO</Button></Link>
                                     </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlansPage;
