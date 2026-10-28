import HomeIcon from "@mui/icons-material/Home";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PeopleIcon from "@mui/icons-material/People";
import SquareFootIcon from "@mui/icons-material/SquareFoot";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PercentIcon from "@mui/icons-material/Percent";
import DiscountIcon from "@mui/icons-material/Discount";
import WeekendIcon from "@mui/icons-material/Weekend";
import PersonIcon from "@mui/icons-material/Person";
import BarChartIcon from "@mui/icons-material/BarChart";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import PieChartIcon from "@mui/icons-material/PieChart";
import TimelineIcon from "@mui/icons-material/Timeline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BusinessIcon from "@mui/icons-material/Business";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import CancelIcon from "@mui/icons-material/Cancel";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import ActivityIcon from "@mui/icons-material/Speed";

/**
 * MUI Icon Mapping Utility
 * Maps string icon names to MUI icon components
 * Matches EXACT icons used in root frontend
 */

export const muiIconMap: Record<string, React.ComponentType<any>> = {
  // === MUI Native Icon Names ===

  // Home & Building
  Home: HomeIcon,
  Business: BusinessIcon,
  AccountBalance: AccountBalanceIcon,

  // Financial
  AttachMoney: AttachMoneyIcon,
  MonetizationOn: MonetizationOnIcon,
  Discount: DiscountIcon,
  Percent: PercentIcon,
  LocalOffer: LocalOfferIcon,
  TrackChanges: TrackChangesIcon,

  // People
  People: PeopleIcon,
  Person: PersonIcon,

  // Business & Operations
  SquareFoot: SquareFootIcon,
  Weekend: WeekendIcon,
  ShoppingCart: ShoppingCartIcon,
  Inventory: InventoryIcon,
  Speed: ActivityIcon,
  AccessTime: AccessTimeIcon,

  // Trends & Charts
  TrendingUp: TrendingUpIcon,
  TrendingDown: TrendingDownIcon,
  BarChart: BarChartIcon,
  ShowChart: ShowChartIcon,
  PieChart: PieChartIcon,
  Timeline: TimelineIcon,
  ArrowUpward: ArrowUpwardIcon,
  ArrowDownward: ArrowDownwardIcon,

  // Status & Alerts
  Warning: WarningIcon,
  Error: ErrorIcon,
  CheckCircle: CheckCircleIcon,
  Info: InfoIcon,
  Close: CloseIcon,
  Cancel: CancelIcon,

  // Date & Time
  CalendarToday: CalendarTodayIcon,

  // Misc
  ExpandLess: ExpandLessIcon,
  ExpandMore: ExpandMoreIcon,

  // === Lucide-React Compatible Aliases ===
  // These map lucide-react icon names to their MUI equivalents
  // for easier migration and compatibility

  Building: BusinessIcon, // alias for Business
  DollarSign: AttachMoneyIcon, // alias for AttachMoney
  Users: PeopleIcon, // alias for People
  Package: InventoryIcon, // alias for Inventory
  Activity: ActivityIcon, // alias for Speed
  Clock: AccessTimeIcon, // alias for AccessTime
  Target: TrackChangesIcon, // alias for TrackChanges
  BarChart3: BarChartIcon, // alias for BarChart
  LineChart: ShowChartIcon, // alias for ShowChart
  AreaChart: TimelineIcon, // alias for Timeline
  ArrowUpRight: ArrowUpwardIcon, // alias for ArrowUpward
  ArrowDownRight: ArrowDownwardIcon, // alias for ArrowDownward
  AlertTriangle: WarningIcon, // alias for Warning
  AlertCircle: ErrorIcon, // alias for Error
  X: CloseIcon, // alias for Close
  XCircle: CancelIcon, // alias for Cancel
  Calendar: CalendarTodayIcon, // alias for CalendarToday
  ChevronUp: ExpandLessIcon, // alias for ExpandLess
  ChevronDown: ExpandMoreIcon, // alias for ExpandMore
  Tag: LocalOfferIcon, // alias for LocalOffer
};

/**
 * Get MUI Icon Component by Name
 * Returns the icon component or a default icon if not found
 */
export function getMuiIcon(
  iconName: string,
  defaultIcon: React.ComponentType<any> = BarChartIcon
): React.ComponentType<any> {
  return muiIconMap[iconName] || defaultIcon;
}

/**
 * Render MUI Icon with Props
 * Helper to render an icon with consistent styling
 * Compatible with our MetricCard component
 * IMPORTANT: Uses inline style={{ color }} NOT sx={{ color }} to match root frontend exactly
 */
export function renderMuiIcon(
  iconName: string,
  color?: string
) {
  const Icon = getMuiIcon(iconName);
  return <Icon style={{ color }} />;
}
