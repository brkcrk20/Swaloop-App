import { AdminKPI, AdminAuditLog, Report, Dispute, Listing, UserProfile } from '../types';
import {
  INITIAL_ADMIN_KPIS,
  INITIAL_ADMIN_LOGS,
  INITIAL_REPORTS,
  OTHER_USERS,
  CURRENT_USER,
} from '../data/mockData';
import { listingService } from './listingService';

let kpisStore: AdminKPI = { ...INITIAL_ADMIN_KPIS };
let reportsStore: Report[] = [...INITIAL_REPORTS];
let auditLogsStore: AdminAuditLog[] = [...INITIAL_ADMIN_LOGS];

const initialDisputes: Dispute[] = [
  {
    id: 'disp-1',
    tradeId: 'trade-offer-2',
    initiator: CURRENT_USER,
    respondent: OTHER_USERS['user-mehmet'],
    initiatorItem: listingService.getAllListings()[3],
    respondentItem: listingService.getAllListings()[2],
    reason: 'Kargo paketinde adaptör eksik çıktı, tamamlanması talep ediliyor.',
    status: 'under_review',
    evidencePhotos: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
    ],
    createdAt: '18 Mayıs 2024, 10:15',
  },
];
let disputesStore: Dispute[] = [...initialDisputes];

export const adminService = {
  getKPIs(): AdminKPI {
    return { ...kpisStore };
  },

  getReports(): Report[] {
    return [...reportsStore];
  },

  getDisputes(): Dispute[] {
    return [...disputesStore];
  },

  getAuditLogs(): AdminAuditLog[] {
    return [...auditLogsStore];
  },

  resolveReport(reportId: string, resolutionNote: string, status: Report['status'] = 'resolved') {
    const rep = reportsStore.find((r) => r.id === reportId);
    if (rep) {
      rep.status = status;
      rep.resolutionNote = resolutionNote;
      this.addAuditLog('Rapor Sonuçlandırıldı', `Rapor #${reportId} (${rep.targetTitle})`, resolutionNote);
    }
  },

  resolveDispute(disputeId: string, decision: string, status: Dispute['status'] = 'resolved_return') {
    const disp = disputesStore.find((d) => d.id === disputeId);
    if (disp) {
      disp.status = status;
      disp.adminDecision = decision;
      this.addAuditLog('Dispute Çözümlendi', `Dispute #${disputeId}`, decision);
    }
  },

  moderateListing(listingId: string, action: 'approve' | 'remove', reason?: string) {
    if (action === 'remove') {
      listingService.updateListing(listingId, { status: 'removed' });
      this.addAuditLog('İlan Kaldırıldı', `İlan #${listingId}`, reason || 'Moderasyon kararı');
    }
  },

  addAuditLog(action: string, target: string, details: string) {
    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}`,
      adminName: 'Yönetici Admin',
      action,
      target,
      timestamp: new Date().toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      ipAddress: '194.27.12.8',
      details,
    };
    auditLogsStore = [newLog, ...auditLogsStore];
  },
};
