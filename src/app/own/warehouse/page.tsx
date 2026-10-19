import { WarehouseManagement } from "@/components/own/warehouse/warehouse-management";
import {
  getOwnWarehouseAction,
  saveOwnWarehouseAction,
} from "@/services/actions/warehouse-actions";

export default function OwnWarehousePage() {
  return (
    <WarehouseManagement
      fetchWarehouse={getOwnWarehouseAction}
      saveWarehouse={saveOwnWarehouseAction}
    />
  );
}
