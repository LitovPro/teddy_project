import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class I18nService {
    private readonly logger = new Logger(I18nService.name);

    private readonly translations = {
        en: {
            // Onboarding
            welcome: "🏰 Welcome to Teddy & Friends! 🐻",
            choose_language: "I'm your personal assistant. To get started, please choose your language:",
            language_options: "🇬🇧 English\n🇵🇹 Português\n\nReply with \"EN\" for English or \"PT\" for Português.",
            welcome_with_code: "🎉 Welcome to Teddy & Friends! 🐻\n\nYour customer number is: {clientCode}\nKeep it handy for all café orders! 📌",
            welcome_help: "I'm here to help you with:\n🎟 Loyalty program (5 visits = 1 FREE HOUR!)\n🧁 Café menu and orders\n🕒 Hours & prices\n🎉 Events and workshops\nℹ️ Rules and information\n\nType \"menu\" to see all available options!",

            // Main Menu
            main_menu: "🤖 *Main Menu*\n\nChoose an option:\n\n🎟 *Loyalty* - Check your loyalty status\n🧁 *Café Menu* - View our menu and prices\n🕒 *Hours & Prices* - Opening hours and play prices\n🎉 *Events* - Upcoming workshops and events\nℹ️ *Rules* - Play area rules and information\n👤 *My Profile* - View your profile and settings\n📞 *Contact* - Contact information\n🚫 *Unsubscribe* - Stop receiving updates\n\nJust type the word (e.g., \"loyalty\" or \"menu\") to continue!",

            // Loyalty
            loyalty_progress: "🎯 *Loyalty Program*\n\nVisit us 5 times to earn 1 hour of free play!\n\nYour current progress: {current}/5 visits\n{remaining} more visits to earn your free hour! 🎉",
            loyalty_completed: "🎉 *Congratulations!*\n\nYou've completed 5 visits and earned a FREE HOUR voucher!\n\nVoucher Code: {voucherCode}\nValid until: {validUntil}\n\nShow this QR code at reception to redeem your free hour! 🎁",
            visit_recorded: "✅ *Visit recorded!*\n\nYour loyalty progress: {current}/5 visits\n{remaining} more visits to earn your free hour! 🎉\n\nThank you for visiting Teddy & Friends! 🐻",
            loyalty_card: "🎟 *Your Loyalty Card*\n\nVisit us 5 times to earn 1 FREE HOUR!\n\nYour current progress: {current}/5 visits\n\nKeep visiting to earn your free hour! 🐻",

            // Menu
            menu_title: "🍽️ *Teddy & Friends Menu*",
            menu_food: "*Food:*",
            menu_drinks: "*Drinks:*",
            menu_item: "• {name} - €{price}",

            // Hours & Prices
            hours_title: "🕒 *Hours & Prices*",
            hours_weekdays: "*Weekdays:* 9:00-18:00",
            hours_weekends: "*Weekends:* 10:00-19:00",
            play_price: "*Play Area:* €{price}/hour per child",

            // Events
            events_title: "🎉 *Upcoming Events*",
            event_item: "📅 {date} at {time}\n{title}\n{description}\nPrice: €{price}",
            no_events: "No upcoming events at the moment. Check back soon!",

            // Rules
            rules_title: "ℹ️ *Play Area Rules*",
            rules_list: "• Children must be supervised at all times\n• No food or drinks in the play area\n• Remove shoes before entering\n• Be respectful to other children\n• Have fun and play safely! 🎈",

            // Profile
            profile_title: "👤 *My Profile*",
            profile_info: "Customer Number: {clientCode}\nLanguage: {language}\nTotal Visits: {totalVisits}\nCurrent Cycle: {current}/5 visits\n\nType \"edit\" to update your information.",

            // Contact
            contact_title: "📞 *Contact Teddy & Friends*",
            contact_info: "📍 Address: Rua das Flores, 123, Lisbon\n📞 Phone: +351 123 456 789\n📧 Email: info@teddyandfriends.pt\n🌐 Website: www.teddyandfriends.pt\n\n🕒 Opening Hours:\nMon-Fri: 9:00-18:00\nSat-Sun: 10:00-19:00",

            // Unsubscribe
            unsubscribe_confirm: "✅ You're unsubscribed from promotional messages.\n\nYou can re-subscribe anytime by typing \"menu\" and selecting your preferences.",
            current_subscriptions: "📧 *Your Current Subscriptions:*",
            no_subscriptions: "You're not subscribed to any notifications.",
            unsubscribe_instructions: "To unsubscribe from a specific type, reply with:\n• \"unsubscribe events\" for events\n• \"unsubscribe promotions\" for promotions\n• \"unsubscribe news\" for news",
            subscription_type_events: "Events & Workshops",
            subscription_type_promotions: "Promotions & Offers",
            subscription_type_news: "News & Updates",

            // Booking
            booking_title: "🎉 *Event Booking*",
            available_events: "*Available Events:*",
            your_bookings: "*Your Bookings:*",
            booking_instructions: "To book an event, please contact us at +351 123 456 789 or visit our reception desk.",
            booking_created: "✅ *Booking Created!*\n\nEvent: {eventTitle}\nDate: {date}\nTime: {time}\nParticipants: {participants}\n\nWe'll confirm your booking shortly!",
            booking_confirmed: "🎉 *Booking Confirmed!*\n\nEvent: {eventTitle}\nDate: {date}\nTime: {time}\n\nWe look forward to seeing you!",
            booking_cancelled: "❌ *Booking Cancelled*\n\nEvent: {eventTitle}\nDate: {date}\nReason: {reason}\n\nTo reschedule, please contact us.",

            // GDPR & Consent
            consent_updated: "✅ *Consent Updated*\n\nMarketing: {marketing}\nGDPR: {gdpr}\n\nYour preferences have been saved.",
            consent_request: "📋 *Consent Request*\n\nWe need your consent to process your data according to GDPR regulations.\n\nPlease contact us to update your preferences.",
            data_deletion_requested: "🗑️ *Data Deletion Requested*\n\nRequest ID: {requestId}\n\nYour data deletion request has been submitted. We'll process it within 30 days.",
            data_export_completed: "📄 *Data Export Completed*\n\nExport ID: {exportId}\n\nYour data has been exported. Contact us to receive your data file.",

            // Help
            help_title: "🤖 *Available Commands:*",
            help_commands: "• \"menu\" - View our menu\n• \"loyalty\" - Check loyalty status\n• \"book\" - Book a visit\n• \"contact\" - Contact information\n• \"help\" - Show this help message",

            // Errors
            command_not_found: "I didn't understand that command. Type \"help\" to see available options or \"menu\" to view our menu! 🐻",
            family_not_found: "Sorry, I couldn't find your profile. Please contact us for assistance.",

            // Confirmation
            appointment_confirmed: "✅ *Appointment Confirmed!*\n\nYour appointment has been confirmed for:\n📅 Date: 12/1\n🕒 Time: 3pm\n\nWe look forward to seeing you at Teddy & Friends! 🐻",
            appointment_cancelled: "❌ *Appointment Cancelled*\n\nYour appointment has been cancelled.\n\nTo reschedule, please reply \"book\" or call us at +351 123 456 789"
        },

        pt: {
            // Onboarding
            welcome: "🏰 Bem-vindo ao Teddy & Friends! 🐻",
            choose_language: "Sou o seu assistente pessoal. Para começar, por favor escolha o seu idioma:",
            language_options: "🇬🇧 English\n🇵🇹 Português\n\nResponda com \"EN\" para Inglês ou \"PT\" para Português.",
            welcome_with_code: "🎉 Bem-vindo ao Teddy & Friends! 🐻\n\nO seu número de cliente é: {clientCode}\nUse-o para os pedidos no café! 📌",
            welcome_help: "Estou aqui para ajudar com:\n🎟 Programa de fidelidade (5 visitas = 1 HORA GRÁTIS!)\n🧁 Menu do café e pedidos\n🕒 Horários e preços\n🎉 Eventos e oficinas\nℹ️ Regras e informações\n\nDigite \"menu\" para ver todas as opções!",

            // Main Menu
            main_menu: "🤖 *Menu Principal*\n\nEscolha uma opção:\n\n🎟 *Fidelidade* - Verifique o seu status de fidelidade\n🧁 *Menu do Café* - Veja o nosso menu e preços\n🕒 *Horários e Preços* - Horários de funcionamento e preços\n🎉 *Eventos* - Próximas oficinas e eventos\nℹ️ *Regras* - Regras da área de brincadeiras e informações\n👤 *Meu Perfil* - Ver o seu perfil e configurações\n📞 *Contacto* - Informações de contacto\n🚫 *Cancelar Inscrição* - Parar de receber atualizações\n\nDigite a palavra (ex: \"fidelidade\" ou \"menu\") para continuar!",

            // Loyalty
            loyalty_progress: "🎯 *Programa de Fidelidade*\n\nVisite-nos 5 vezes para ganhar 1 hora grátis!\n\nO seu progresso atual: {current}/5 visitas\n{remaining} mais visitas para ganhar a sua hora grátis! 🎉",
            loyalty_completed: "🎉 *Parabéns!*\n\nCompletou 5 visitas e ganhou um voucher de 1 HORA GRÁTIS!\n\nCódigo do Voucher: {voucherCode}\nVálido até: {validUntil}\n\nMostre este código QR na receção para usar a sua hora grátis! 🎁",
            visit_recorded: "✅ *Visita registada!*\n\nO seu progresso de fidelidade: {current}/5 visitas\n{remaining} mais visitas para ganhar a sua hora grátis! 🎉\n\nObrigado por visitar o Teddy & Friends! 🐻",
            loyalty_card: "🎟 *O Seu Cartão de Fidelidade*\n\nVisite-nos 5 vezes para ganhar 1 HORA GRÁTIS!\n\nO seu progresso atual: {current}/5 visitas\n\nContinue a visitar para ganhar a sua hora grátis! 🐻",

            // Menu
            menu_title: "🍽️ *Menu Teddy & Friends*",
            menu_food: "*Comida:*",
            menu_drinks: "*Bebidas:*",
            menu_item: "• {name} - €{price}",

            // Hours & Prices
            hours_title: "🕒 *Horários e Preços*",
            hours_weekdays: "*Dias úteis:* 9:00-18:00",
            hours_weekends: "*Fins de semana:* 10:00-19:00",
            play_price: "*Área de Brincadeiras:* €{price}/hora por criança",

            // Events
            events_title: "🎉 *Próximos Eventos*",
            event_item: "📅 {date} às {time}\n{title}\n{description}\nPreço: €{price}",
            no_events: "Não há eventos próximos no momento. Volte em breve!",

            // Rules
            rules_title: "ℹ️ *Regras da Área de Brincadeiras*",
            rules_list: "• As crianças devem ser supervisionadas sempre\n• Não é permitida comida ou bebidas na área de brincadeiras\n• Retire os sapatos antes de entrar\n• Seja respeitoso com outras crianças\n• Divirta-se e brinque com segurança! 🎈",

            // Profile
            profile_title: "👤 *Meu Perfil*",
            profile_info: "Número de Cliente: {clientCode}\nIdioma: {language}\nTotal de Visitas: {totalVisits}\nCiclo Atual: {current}/5 visitas\n\nDigite \"editar\" para atualizar as suas informações.",

            // Contact
            contact_title: "📞 *Contacto Teddy & Friends*",
            contact_info: "📍 Morada: Rua das Flores, 123, Lisboa\n📞 Telefone: +351 123 456 789\n📧 Email: info@teddyandfriends.pt\n🌐 Website: www.teddyandfriends.pt\n\n🕒 Horários de Funcionamento:\nSeg-Sex: 9:00-18:00\nSáb-Dom: 10:00-19:00",

            // Unsubscribe
            unsubscribe_confirm: "✅ Foi cancelada a subscrição de mensagens promocionais.\n\nPode voltar a subscrever a qualquer momento digitando \"menu\" e selecionando as suas preferências.",
            current_subscriptions: "📧 *As Suas Subscrições Atuais:*",
            no_subscriptions: "Não está subscrito a nenhuma notificação.",
            unsubscribe_instructions: "Para cancelar um tipo específico, responda com:\n• \"cancelar eventos\" para eventos\n• \"cancelar promoções\" para promoções\n• \"cancelar notícias\" para notícias",
            subscription_type_events: "Eventos & Workshops",
            subscription_type_promotions: "Promoções & Ofertas",
            subscription_type_news: "Notícias & Atualizações",

            // Booking
            booking_title: "🎉 *Reserva de Eventos*",
            available_events: "*Eventos Disponíveis:*",
            your_bookings: "*As Suas Reservas:*",
            booking_instructions: "Para reservar um evento, contacte-nos no +351 123 456 789 ou visite a nossa receção.",
            booking_created: "✅ *Reserva Criada!*\n\nEvento: {eventTitle}\nData: {date}\nHora: {time}\nParticipantes: {participants}\n\nConfirmaremos a sua reserva em breve!",
            booking_confirmed: "🎉 *Reserva Confirmada!*\n\nEvento: {eventTitle}\nData: {date}\nHora: {time}\n\nEsperamos vê-lo!",
            booking_cancelled: "❌ *Reserva Cancelada*\n\nEvento: {eventTitle}\nData: {date}\nMotivo: {reason}\n\nPara reagendar, contacte-nos.",

            // GDPR & Consent
            consent_updated: "✅ *Consentimento Atualizado*\n\nMarketing: {marketing}\nGDPR: {gdpr}\n\nAs suas preferências foram guardadas.",
            consent_request: "📋 *Pedido de Consentimento*\n\nPrecisamos do seu consentimento para processar os seus dados de acordo com o RGPD.\n\nContacte-nos para atualizar as suas preferências.",
            data_deletion_requested: "🗑️ *Pedido de Eliminação de Dados*\n\nID do Pedido: {requestId}\n\nO seu pedido de eliminação de dados foi submetido. Processaremos em 30 dias.",
            data_export_completed: "📄 *Exportação de Dados Concluída*\n\nID da Exportação: {exportId}\n\nOs seus dados foram exportados. Contacte-nos para receber o ficheiro.",

            // Help
            help_title: "🤖 *Comandos Disponíveis:*",
            help_commands: "• \"menu\" - Ver o nosso menu\n• \"fidelidade\" - Verificar status de fidelidade\n• \"reservar\" - Reservar uma visita\n• \"contacto\" - Informações de contacto\n• \"ajuda\" - Mostrar esta mensagem de ajuda",

            // Errors
            command_not_found: "Não entendi esse comando. Digite \"ajuda\" para ver as opções disponíveis ou \"menu\" para ver o nosso menu! 🐻",
            family_not_found: "Desculpe, não consegui encontrar o seu perfil. Por favor, contacte-nos para assistência.",

            // Confirmation
            appointment_confirmed: "✅ *Reserva Confirmada!*\n\nA sua reserva foi confirmada para:\n📅 Data: 12/1\n🕒 Hora: 15:00\n\nEsperamos vê-lo no Teddy & Friends! 🐻",
            appointment_cancelled: "❌ *Reserva Cancelada*\n\nA sua reserva foi cancelada.\n\nPara reagendar, responda \"reservar\" ou ligue-nos para +351 123 456 789"
        }
    };

    /**
     * Получает перевод по ключу и языку
     */
    getTranslation(key: string, language: 'EN' | 'PT' = 'EN'): string {
        const lang = language.toLowerCase() as 'en' | 'pt';
        const translation = this.translations[lang]?.[key];

        if (!translation) {
            this.logger.warn(`Translation not found for key: ${key}, language: ${language}`);
            return this.translations.en[key] || key;
        }

        return translation;
    }

    /**
     * Получает перевод с подстановкой переменных
     */
    getTranslationWithParams(key: string, params: Record<string, string | number>, language: 'EN' | 'PT' = 'EN'): string {
        let translation = this.getTranslation(key, language);

        // Заменяем переменные в формате {variable}
        Object.entries(params).forEach(([param, value]) => {
            translation = translation.replace(new RegExp(`{${param}}`, 'g'), String(value));
        });

        return translation;
    }

    /**
     * Получает перевод меню
     */
    getMenuTranslation(menuItem: string, language: 'EN' | 'PT' = 'EN'): string {
        const lang = language.toLowerCase() as 'en' | 'pt';

        // Здесь можно добавить логику для получения переводов меню из базы данных
        // Пока возвращаем базовый перевод
        return this.getTranslation(`menu_${menuItem}`, language);
    }

    /**
     * Получает шаблон сообщения
     */
    getMessageTemplate(template: string, language: 'EN' | 'PT' = 'EN'): string {
        return this.getTranslation(template, language);
    }

    /**
     * Получает все доступные ключи переводов
     */
    getAvailableKeys(): string[] {
        return Object.keys(this.translations.en);
    }

    /**
     * Проверяет, существует ли перевод для ключа
     */
    hasTranslation(key: string, language: 'EN' | 'PT' = 'EN'): boolean {
        const lang = language.toLowerCase() as 'en' | 'pt';
        return key in this.translations[lang];
    }

    /**
     * Получает перевод с fallback на английский
     */
    getTranslationWithFallback(key: string, language: 'EN' | 'PT' = 'EN'): string {
        const lang = language.toLowerCase() as 'en' | 'pt';
        const translation = this.translations[lang]?.[key];

        if (translation) {
            return translation;
        }

        // Fallback на английский
        const fallback = this.translations.en[key];
        if (fallback) {
            this.logger.warn(`Using English fallback for key: ${key}, language: ${language}`);
            return fallback;
        }

        this.logger.error(`No translation found for key: ${key}`);
        return key;
    }
}
